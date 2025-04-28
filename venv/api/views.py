from rest_framework import viewsets, permissions, status
import logging
import os 
import re
from rest_framework.decorators import action
import uuid
from django.db.models import Prefetch
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import serializers  # För att hantera formulärliknande validering
from django.core.mail import send_mail
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from rest_framework import generics
from django.conf import settings
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import Http404, HttpResponse
from django.views.generic import DetailView
from django.contrib.auth.mixins import LoginRequiredMixin
from rest_framework.generics import RetrieveAPIView
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from .models import (
    User, Company, 
    CourseToBuy, CompanyCourse, CompanyDocument, Order ,LanguageOption, ScormPackage, UserScormStatus, Invitation )
from .serializers import (
    UserSerializer, 
    CompanySerializer, 
    CustomTokenObtainPairSerializer, 
    CourseToBuySerializer,
    TeamMemberSerializer, 
    CompanyDocumentSerializer,
    OrderSerializer,
    LanguageOptionSerializer,
    CompanyDashboardSerializer,
)

    
class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view that uses our enhanced serializer."""
    serializer_class = CustomTokenObtainPairSerializer  # ÄNDRA HÄR


class UserViewSet(viewsets.ModelViewSet):
    """API endpoint for users."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = []  # Överväg att använda IsAuthenticated eller anpassade behörigheter
    
    def get_queryset(self):
        """Filter users based on the requesting user's company and admin status."""
        user = self.request.user
        if user.is_superuser:
            return User.objects.all()
        elif user.is_admin and user.company:
            return User.objects.filter(company=user.company)
        return User.objects.filter(id=user.id)

    @action(detail=True, methods=['PUT'], parser_classes=[MultiPartParser])
    def upload_profile_image(self, request, pk=None):
        """Endpoint for uploading profile images."""
        user = self.get_object()
        
        # Verifiera att användaren har behörighet
        if not (request.user.is_superuser or 
                (request.user.is_admin and request.user.company == user.company) or 
                request.user == user):
            return Response(
                {'error': 'You do not have permission to update this profile'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if 'profile_img' not in request.FILES:
            return Response(
                {'error': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validera filtypen och storlek
        image_file = request.FILES['profile_img']
        if not image_file.content_type.startswith('image/'):
            return Response(
                {'error': 'File is not an image'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if image_file.size > 2 * 1024 * 1024:  # 2MB max
            return Response(
                {'error': 'Image file too large (max 2MB)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Spara bilden
        user.profile_img = image_file
        user.save()
        
        # Returnera den uppdaterade användaren med serializer
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=True, methods=['DELETE'])
    def remove_profile_image(self, request, pk=None):
        """Endpoint for removing profile images."""
        user = self.get_object()
        
        # Verifiera behörighet
        if not (request.user.is_superuser or 
                (request.user.is_admin and request.user.company == user.company) or 
                request.user == user):
            return Response(
                {'error': 'You do not have permission to update this profile'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not user.profile_img:
            return Response(
                {'error': 'No profile image to remove'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ta bort bilden
        user.profile_img.delete(save=False)
        user.profile_img = None
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)




class CompanyViewSet(viewsets.ModelViewSet):
    """API endpoint for companies."""
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = []
    
    def get_queryset(self):
        """Filter companies based on the requesting user's admin status."""
        user = self.request.user
        if user.is_superuser:
            return Company.objects.all()
        elif user.company:
            return Company.objects.filter(id=user.company.id)
        return Company.objects.none()




class CompanyDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # För att hantera filuppladdning

    def get(self, request):
        try:
            company = request.user.company
            if not company:
                return Response({'error': 'Användaren tillhör inget företag.'}, status=status.HTTP_400_BAD_REQUEST)

            serializer = CompanyDashboardSerializer(company)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Fel vid hämtning av företagsdashboard: {e}")
            return Response({'error': 'Ett internt serverfel uppstod.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request):
        try:
            company = request.user.company
            if not company:
                return Response({'error': 'Användaren tillhör inget företag.'}, status=status.HTTP_400_BAD_REQUEST)

            # Check if the user is an admin
            if not request.user.is_admin and not request.user.is_superuser:
                return Response({"error": "Du har inte behörighet att ändra företagsinformation."}, status=status.HTTP_403_FORBIDDEN)

            serializer = CompanyDashboardSerializer(company, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Fel vid uppdatering av företagsdashboard: {e}")
            return Response({'error': 'Ett internt serverfel uppstod.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
class CourseToBuyListView(APIView):
    def get(self, request, *args, **kwargs):
        # Hämta endast publicerade kurser och ordna dem efter skapelsedatum (senaste först)
        published_courses = CourseToBuy.objects.filter(is_marketplace=True)
        serializer = CourseToBuySerializer(published_courses, many=True)
        return Response(serializer.data)
    

class CourseToBuyDetail(RetrieveAPIView):
    queryset = CourseToBuy.objects.all()
    serializer_class = CourseToBuySerializer
    

class TeamListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.company:
            return Response(
                {"error": "You do not belong to any company."},
                status=400
            )

        if not user.is_admin:
            return Response(
                {"error": "Only admins can view the team."},
                status=403
            )

        team_members = User.objects.filter(company=user.company)
        serializer = TeamMemberSerializer(team_members, many=True)
        
        # Returnera direkt arrayen med medlemmar
        return Response(serializer.data)  # <-- Detta är redan en array
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_member(request):
    user = request.user

    if not user.company:
        return Response({"error": "Du tillhör inget företag"}, status=400)

    if not user.is_admin and not user.is_superuser:
        return Response({"error": "Du har inte behörighet att bjuda in medlemmar"}, status=403)

    email = request.data.get('email')
    if not email:
        return Response({"error": "E-postadress krävs"}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({"error": "Användaren med den e-postadressen finns redan"}, status=400)

    try:
        # Skapa en unik inbjudningstoken
        token = uuid.uuid4()

        # Skapa en ny Invitation-instans
        invitation = Invitation.objects.create(
            token=token,
            email=email,
            company=user.company,
            invited_by=user
        )

        # Hårdkoda frontend-URL (för utveckling) eller hämta från settings
        frontend_base_url = "http://localhost:5173"  # ÄNDRA VID BEHOV
        accept_url = f"{frontend_base_url}/accept-invite/{token}/"

        # Skicka e-postinbjudan
        subject = f"Inbjudan till {user.company.name}"
        message = f"Du har blivit inbjuden till {user.company.name}. Klicka på länken för att acceptera inbjudan: {accept_url}"
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [email]

        send_mail(subject, message, from_email, recipient_list, fail_silently=False)

        return Response({"message": f"Inbjudan har skickats till {email}"})

    except Exception as e:
        print(f"Fel vid skickande av inbjudan: {e}")
        return Response({"error": "Kunde inte skicka inbjudan"}, status=500)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_member(request, user_id):
    """Allows a logged-in user to remove another user from the company"""
    
    try:
        user = User.objects.get(id=user_id)
        user.delete()
        return Response({"message": "User has been removed!"}, status=200)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=404)
    

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.auth = None  # This only works if you are using DRF's own token-auth
        return Response({"message": "Successfully logged out"}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_members(request):
    users = User.objects.filter(company=request.user.company)
    # Important: Add context={'request': request} here
    serializer = UserSerializer(users, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_courses(request):
    """Fetch courses that the user's company has access to."""
    # Get the user's company
    company = request.user.company
    
    if not company:
        return Response({"error": "You do not belong to any company"}, status=400)
    
    # Get the company's courses
    company_courses = CompanyCourse.objects.filter(company=company)
    courses = [cc.course for cc in company_courses]
    
    # Serialize the courses
    serializer = CourseToBuySerializer(courses, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
def get_scorm_url(request, pk):
    try:
        course = CourseToBuy.objects.get(pk=pk)
        if not course.scorm_file:
            raise Http404("No SCORM content available")
        
        return Response({
            'scorm_url': course.scorm_file.url,
            'course_title': course.title
        })
    except CourseToBuy.DoesNotExist:
        raise Http404("Course not found")


logger = logging.getLogger(__name__)


@api_view(['GET'])
def get_scorm_launch_data(request, pk, language_code=None):
    try:
        course = CourseToBuy.objects.get(pk=pk)
    except CourseToBuy.DoesNotExist:
        return Response({'error': 'Kursen hittades inte.'}, status=status.HTTP_404_NOT_FOUND)

    if not language_code:
        return Response({'error': 'Språkkod måste anges.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        scorm_package = ScormPackage.objects.get(course=course, language=language_code)
        if scorm_package.scorm_unpacked_dir:
            scorm_url = f"http://localhost:8000{settings.MEDIA_URL}scorm_unpacked/{os.path.basename(scorm_package.scorm_unpacked_dir)}/index.html"
            return Response({'scorm_url': scorm_url, 'course_title': course.title}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'SCORM-innehållet är inte uppackat för detta språk.'}, status=status.HTTP_404_NOT_FOUND)
    except ScormPackage.DoesNotExist:
        return Response({'error': f'Inget SCORM-paket hittades för språket {language_code}.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Ett fel inträffade: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    



class CompanyDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = CompanyDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser] # Viktigt för filuppladdning

    def get_queryset(self):
        if self.request.user.company:
            return CompanyDocument.objects.filter(company=self.request.user.company).order_by('-uploaded_at')
        return CompanyDocument.objects.none()

    def create(self, request, *args, **kwargs):
        if not request.user.company:
            return Response({'error': 'Användaren tillhör inget företag.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company, user=self.request.user)
    # SE TILL ATT perform_create INTE RETURNERAR NÅGOT EXPLICIT OM DU ANVÄNDER ModelViewSet

class OrderViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        serializer = OrderSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LanguageOptionListView(generics.ListAPIView):
    queryset = LanguageOption.objects.all()
    serializer_class = LanguageOptionSerializer
    
@api_view(['GET'])
def get_available_languages(request, pk):
    try:
        course = CourseToBuy.objects.get(pk=pk)
    except CourseToBuy.DoesNotExist:
        return Response({'error': 'Kursen hittades inte.'}, status=status.HTTP_404_NOT_FOUND)

    user_company = request.user.company  # Antag att användaren har ett företag

    try:
        company_course = CompanyCourse.objects.get(company=user_company, course=course)
        available_language_codes = company_course.available_languages
        languages = []
        for code in available_language_codes:
            try:
                language_name = CourseToBuy.LanguageChoices(code).label
                languages.append({'code': code, 'name': language_name})
            except ValueError:
                print(f"Varning: Ogiltig språkkod i databasen: {code}")
        return Response({'languages': languages}, status=status.HTTP_200_OK)
    except CompanyCourse.DoesNotExist:
        return Response({'error': 'Företaget har inte tillgång till den här kursen.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Ett fel inträffade: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def set_scorm_data(request):
    user = request.user  # Antag autentisering är på plats
    course_id = request.data.get('courseId')
    cmi_element = request.data.get('cmiElement')
    value = request.data.get('value')

    try:
        user_scorm_status, created = UserScormStatus.objects.get_or_create(
            user=user,
            course_id=course_id
        )
        progress_data = user_scorm_status.progress_data
        progress_data[cmi_element] = value
        user_scorm_status.progress_data = progress_data
        user_scorm_status.save()
        return Response({'status': 'success'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def get_scorm_data(request):
    user = request.user
    course_id = request.data.get('courseId')
    cmi_element = request.data.get('cmiElement')

    try:
        user_scorm_status = UserScormStatus.objects.get(user=user, course_id=course_id)
        value = user_scorm_status.progress_data.get(cmi_element, '')
        return Response({'status': 'success', 'value': value}, status=status.HTTP_200_OK)
    except UserScormStatus.DoesNotExist:
        return Response({'status': 'success', 'value': ''}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

import requests
from django.http import HttpResponse
from django.conf import settings
import re

def scorm_proxy(request):
    scorm_url = request.GET.get('url', None)
    if not scorm_url:
        return HttpResponse("Missing 'url' parameter", status=400)

    try:
        response = requests.get(scorm_url)
        response.raise_for_status()  # Raise an exception for bad status codes
        html_content = response.text

        # Antag att din React-applikation serverar statiska filer under /static/
        # Justera sökvägen till din scormApiWrapper.js om det behövs
        script_tag = f'<script src="{settings.REACT_STATIC_URL}scormApiWrapper.js"></script>'

        # Injektion i <head>-sektionen (enkel regex)
        head_match = re.search(r'<head[^>]*>', html_content, re.IGNORECASE)
        if head_match:
            injection_point = head_match.end()
            modified_html = html_content[:injection_point] + script_tag + html_content[injection_point:]
            return HttpResponse(modified_html, content_type="text/html")
        else:
            return HttpResponse("Could not find <head> tag in SCORM content", status=500)

    except requests.exceptions.RequestException as e:
        return HttpResponse(f"Error fetching SCORM content: {e}", status=500)
    


@api_view(['GET'])
def accept_invite_view(request, token):
    try:
        invitation = get_object_or_404(Invitation, token=token)

        if invitation.accepted:
            return Response({"error": "Denna inbjudan har redan accepterats."}, status=400)

        if invitation.expires_at and invitation.expires_at < timezone.now():
            return Response({"error": "Denna inbjudan har utgått."}, status=400)

        email = invitation.email
        company = invitation.company

        if not email:
            return Response({"error": "Ogiltig inbjudan (ingen e-post kopplad)."}, status=400)

        # Försök hitta en användare med den inbjudna e-postadressen
        user = None
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            company_name = company.name
            company_id = company.id
            company_logo_url = company.logo.url if hasattr(company, 'logo') and company.logo else None
            
            return Response({
                "message": "Användare behöver skapa ett konto.",
                "email": email,
                "token": token,
                "company_name": company_name,
                "company_id": company_id,
                "company_logo_url": company_logo_url
            })

        # Om användaren finns, koppla dem till företaget och markera inbjudan som accepterad
        if user and user.company != company:
            user.company = company
            user.save()
            invitation.accepted = True
            invitation.save()
            return Response({"message": f"Användare {email} har kopplats till {company.name}."}, status=200)
        elif user and user.company == company:
            invitation.accepted = True
            invitation.save()
            return Response({"message": f"Användare {email} är redan medlem i {company.name}."}, status=200)
        else:
            return Response({"error": "Något gick fel vid hantering av inbjudan."}, status=500)

    except Exception as e:
        print(f"Fel vid accepterande av inbjudan: {e}")
        return Response({"error": "Kunde inte acceptera inbjudan."}, status=500)
    
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    email = request.data.get('email')
    password = request.data.get('password')
    invite_token = request.data.get('invite_token')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    profile_img_file = request.FILES.get('profile_img') # Använd 'profile_img' här
    learning_style = request.data.get('learning_style')

    if not email or not password or not invite_token or not first_name or not last_name or not learning_style:
        return Response({"error": "E-post, lösenord, inbjudningstoken, förnamn, efternamn och lärningsstil krävs."}, status=400)

    try:
        invitation = get_object_or_404(Invitation, token=invite_token, accepted=False)

        if invitation.email != email:
            return Response({"error": "Ogiltig inbjudning för den här e-postadressen."}, status=400)

        with transaction.atomic():
            user = User.objects.create_user(email=email, password=password, first_name=first_name, last_name=last_name)
            user.company = invitation.company
            user.learning_style = learning_style  # Spara lärningsstilen direkt på User-objektet
            if profile_img_file:
                user.profile_img = profile_img_file
            user.save()

            invitation.accepted = True
            invitation.save()

            return Response({"message": "Användare skapad och kopplad till företaget."}, status=201)

    except Invitation.DoesNotExist:
        return Response({"error": "Ogiltig eller använd inbjudningstoken."}, status=400)
    except Exception as e:
        print(f"Fel vid registrering: {e}")
        return Response({"error": "Kunde inte skapa användare."}, status=500)