from rest_framework import serializers
from .models import ( 
    User, Company, CourseToBuy,CompanyDocument, Order, LanguageOption, 
    )
from django.contrib.auth import authenticate
from django.conf import settings
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.urls import reverse





class CompanyDashboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['dashboard_text', 'logo']  # Fälten som ska uppdateras
        
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom serializer to add extra user info to token response."""

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user  # Access the user instance

        # Add extra information to the response
        data['user_id'] = user.id
        if user.company:
            data['company_id'] = user.company.id
            data['company_name'] = user.company.name
            data['is_admin'] = user.is_admin
        else:
            data['company_id'] = None  # Or a default value, or handle as you see fit
            data['company_name'] = None
        data['email'] = user.email
        # Add any other user-specific data you need

        return data
    
class UserSerializer(serializers.ModelSerializer):
    profile_img_url = serializers.SerializerMethodField()
    profile_img_thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 
                 'is_admin', 'profile_img_url', 'profile_img_thumbnail_url',
                 'company']

    def get_profile_img_url(self, obj):
        if not obj.profile_img:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.profile_img.url)
        return obj.profile_img.url

    def get_profile_img_thumbnail_url(self, obj):
        if not obj.profile_img:
            return None
        try:
            from sorl.thumbnail import get_thumbnail
            im = get_thumbnail(obj.profile_img, '100x100', crop='center', quality=99)
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(im.url)
            return im.url
        except:
            return self.get_profile_img_url(obj)


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']



class CourseToBuySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    def get_image_url(self, obj):
        if obj.img:  # Se till att fältet matchar ditt model-fält
            return f"{settings.MEDIA_URL}{obj.img}"
        return None
    
    class Meta:
        model = CourseToBuy
        fields = ['id', 'title', 'description', 'price', 'bransch_typ','language_icon', 'image_url', "time_to_complete",]
        
class TeamMemberSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    user_detail = serializers.SerializerMethodField()
    is_current_user = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'first_name',
            'last_name',
            'is_admin',
            'profile_image',
            'user_detail',
            'is_current_user',
            'last_login'
        ]
        read_only_fields = fields

    def get_profile_image(self, obj):
        if obj.profile_img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_img.url)
            return obj.profile_img.url
        return None

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_user_detail(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(reverse('user-detail', args=[obj.id]))
        return None

    def get_is_current_user(self, obj):
        request = self.context.get('request')
        if request:
            return obj.id == request.user.id
        return False


@api_view(['GET'])
def get_company_bransch(request):
    try:
        company = request.user.company  # Anta att användaren har ett kopplat företag
        return Response({'bransch_typ': company.bransch_typ})
    except Company.DoesNotExist:
        return Response({'error': 'Company not found'}, status=404)
    
class CompanyDocumentSerializer(serializers.ModelSerializer):
    document = serializers.FileField()  # Viktigt för filuppladdning

    class Meta:
        model = CompanyDocument
        fields = ['id', 'company', 'user', 'title', 'document', 'uploaded_at']
        read_only_fields = ['id', 'company', 'user', 'uploaded_at']


class OrderSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(queryset=CourseToBuy.objects.all())
    company = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all(), required=False, allow_null=True, write_only=True) # Gör icke-obligatoriskt och skrivskyddat för inkommande data
    languages = serializers.ListField(child=serializers.CharField())
    note = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Order
        fields = ['id', 'course', 'company', 'languages', 'note']
        read_only_fields = ['id', 'company'] # Gör company skrivskyddat vid skapande via API

    def create(self, validated_data):
        user = self.context['request'].user
        try:
            company = user.company  # Antag att din User-modell har en one-to-many relation till Company via 'company_set' eller en ForeignKey 'company'
            validated_data['company'] = company
        except Company.DoesNotExist:
            raise serializers.ValidationError({"company": "Användaren är inte kopplad till ett företag."})
        return Order.objects.create(**validated_data)

class LanguageOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LanguageOption
        fields = ['value', 'label', 'price']