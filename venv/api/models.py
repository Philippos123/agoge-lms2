from django.db import models
import logging 
import os
import uuid
import datetime
from pathlib import Path
import zipfile
from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.core.validators import FileExtensionValidator

logger = logging.getLogger(__name__)
datetime.datetime.now()


class UserManager(BaseUserManager):
    """Custom user manager that uses email as the unique identifier instead of username."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)
class User(AbstractUser):
    """Custom User model with email as the unique identifier instead of username."""

    username = None
    email = models.EmailField(_('email address'), unique=True)
    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='users', null=True, blank=True)
    is_admin = models.BooleanField(default=False)
    id = models.AutoField(primary_key=True)
    profile_img = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    learning_style = models.CharField(
        max_length=20,
        choices=[
            ('visual', 'Visuellt'),
            ('auditory', 'Auditivt (genom att lyssna)'),
            ('kinesthetic', 'Kinestetiskt (genom att göra)'),
            ('readingWriting', 'Genom att läsa och skriva'),
        ],
        null=True,
        blank=True,
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()  # Koppla den anpassade UserManager


    def __str__(self):
        return self.email


class Company(models.Model):
    """Company model to group users and store company-specific settings."""
    BRANSCHTYP_CHOICES = [ 
        ('teknik', 'Teknik'),
        ('vård', 'Vård'),
        ('handel', 'Handel'),
        ('service', 'Service'),
        ('fordon', 'Fordon'),
        ('industri', 'Industri'),
        ('sälj', 'Sälj'),
        ('ekonomi', 'Ekonomi'),
        ('it', 'IT'),
        ('bygg', 'Bygg'),
        ('transport', 'Transport'),
        ('skola', 'Skola'),
        ('annat', 'Annat'),
    ]        
    name = models.CharField(max_length=255)
    bransch_typ = models.CharField(max_length=10, choices=BRANSCHTYP_CHOICES, default='Okänd')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    id = models.AutoField(primary_key=True)
    dashboard_text = models.TextField(blank=True, null=True, verbose_name="Information om bolaget")
    logo = models.ImageField(
        upload_to='company_logos/',
        null=True,
        blank=True,
        verbose_name="Företagslogotyp",
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'gif', 'svg'])]
    )


    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Companies"
        



        
        
class Language(models.Model):
    name = models.CharField(max_length=20, unique=True)  # T.ex. 'English', 'Swedish'
    code = models.CharField(max_length=2, unique=True)    # T.ex. 'EN', 'SE'
    
class CourseToBuy(models.Model):
    scorm_file = models.FileField(
        upload_to='scorm_packages/%Y/%m/%d/',  # Organisera i datum-mappar
        null=True,
        blank=True,
        validators=[
            FileExtensionValidator(['zip']),
              # Max 50MB
        ],
        help_text="Ladda upp ett SCORM-paket (ZIP-fil, max 50MB)"
    )
    
    scorm_unpacked_dir = models.CharField(max_length=255, blank=True, null=True)  # Lägg till detta

    scorm_identifier = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Unik identifierare för SCORM-paketet"
    )
    
    # Lägg till denna metod för validering
    def clean(self):
        if self.scorm_file and not self.scorm_file.name.lower().endswith('.zip'):
            raise ({'scorm_file': "Endast ZIP-filer accepteras"})

    
    
    class LanguageChoices(models.TextChoices):
        EN = 'EN', 'English'
        RU = 'RU', 'Russian'
        UA = 'UA', 'Ukrainian'
        SE = 'SE', 'Swedish'
        DE = 'DE', 'German'
        FR = 'FR', 'French'
        IT = 'IT', 'Italian'
        ES = 'ES', 'Spanish'
        FA = 'FA', 'Persian'

    BRANSCHTYP_CHOICES = [
        ('teknik', 'Teknik'),
        ('vård', 'Vård'),
        ('handel', 'Handel'),
        ('service', 'Service'),
        ('fordon', 'Fordon'),
        ('industri', 'Industri'),
        ('sälj', 'Sälj'),
        ('ekonomi', 'Ekonomi'),
        ('it', 'IT'),
        ('bygg', 'Bygg'),
        ('transport', 'Transport'),
        ('skola', 'Skola'),
        ('annat', 'Annat'),
    ]
    
    price = models.FloatField()
    title = models.CharField(max_length=255)
    bransch_typ = models.CharField(max_length=10, choices=BRANSCHTYP_CHOICES, default='Okänd')
    description = models.TextField()
    img = models.ImageField(upload_to='course_images/', null=True, blank=True)
    time_to_complete = models.IntegerField()
    language = models.CharField(
        max_length=2,
        choices=LanguageChoices.choices,
        default=LanguageChoices.EN,
    )
    id = models.AutoField(primary_key=True)
    # Nytt fält för att koppla kursen till ett specifikt företag
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='company_specific_courses')


    # Nytt fält för att bestämma om kursen ska visas på marknadsplatsen
    is_marketplace = models.BooleanField(default=True, help_text="Om kursen ska visas på marknadsplatsen eller inte")

    def __str__(self):
        return self.title

    @property
    def language_icon(self):
        # Här definierar vi en enkel metod för att hämta en ikon baserat på språkvalet
        icon_map = {
            'EN': '🇬🇧',  # Engelsk flagga
            'RU': '🇷🇺',  # Rysk flagga
            'UA': '🇺🇦',  # Ukrainsk flagga
            'SE': '🇸🇪',  # Svensk flagga
            'DE': '🇩🇪',  # Tysk flagga
            'FR': '🇫🇷',  # Fransk flagga
            'IT': '🇮🇹',  # Italiensk flagga
            'ES': '🇪🇸',  # Spansk flagga
        }
        return icon_map.get(self.language, '️')  # Standardflagg om inget språk finns
    


    
class CompanyCourse(models.Model):
    """Relation mellan företag och kurser de har köpt/har tillgång till."""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='company_courses')
    course = models.ForeignKey(CourseToBuy, on_delete=models.CASCADE, related_name='company_courses')
    is_ordered = models.BooleanField(default=False)  # Markera om kursen är beställd eller köpt
    available_languages = models.JSONField(default=list, help_text="Lista med tillgängliga språkkoder för företaget för denna kurs")

    class Meta:
        unique_together = ['company', 'course']  # Ett företag kan bara köpa en kurs en gång

    def __str__(self):
        return f"{self.company.name} - {self.course.title}"

# Modeller för kursmoduler och innehåll

class UserScormStatus(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scorm_statuses')
    course = models.ForeignKey(CourseToBuy, on_delete=models.CASCADE)
    completion_status = models.CharField(max_length=20, default='not attempted')
    score = models.FloatField(null=True, blank=True)
    total_time = models.CharField(max_length=50, blank=True, null=True)
    last_accessed = models.DateTimeField(auto_now=True)
    progress_data = models.JSONField(default=dict)  # För att lagra detaljerad SCORM-data
    
    class Meta:
        unique_together = ['user', 'course']
    
    def __str__(self):
        return f"{self.user.email} - {self.course.title}"
    
class CompanyDocument(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='documents')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, help_text="Användaren som laddade upp dokumentet")
    document = models.FileField(upload_to='company_documents/%Y/%m/%d/', validators=[FileExtensionValidator(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png'])])
    title = models.CharField(max_length=255, blank=True, null=True, help_text="Valfri titel för dokumentet")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company.name} - {self.title or self.document.name}"

    class Meta:
        verbose_name_plural = "Company Documents"
        ordering = ['-uploaded_at']


class Order(models.Model):
    course = models.ForeignKey(CourseToBuy, on_delete=models.CASCADE, related_name='orders')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='orders')
    languages = models.JSONField(default=list)  # Lagrar valda språk som en JSON-lista
    note = models.TextField(blank=True, null=True)
    order_date = models.DateTimeField(auto_now_add=True)
    is_paid = models.BooleanField(default=False)
    invoice_sent = models.BooleanField(default=False)

    def __str__(self):
        return f"Order #{self.id} - {self.course.title} - {self.company.name}"
    

class LanguageOption(models.Model):
    value = models.CharField(max_length=50, unique=True, verbose_name="Språkkod")
    label = models.CharField(max_length=100, verbose_name="Visningsnamn")
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Pris (SEK)")

    def __str__(self):
        return f"{self.label} ({self.price} kr)"

    class Meta:
        verbose_name = "Språkval"
        verbose_name_plural = "Språkval"
        
        
class ScormPackage(models.Model):
    course = models.ForeignKey(CourseToBuy, related_name='scorm_packages', on_delete=models.CASCADE)
    language = models.CharField(
        max_length=2,
        choices=CourseToBuy.LanguageChoices.choices,
        default=CourseToBuy.LanguageChoices.EN,
        help_text="Språkkod för detta SCORM-paket"
    )
    package_file = models.FileField(
        upload_to='scorm_packages/%Y/%m/%d/',
        validators=[FileExtensionValidator(['zip'])],
        help_text="Ladda upp SCORM-paket (ZIP)"
    )
    scorm_unpacked_dir = models.CharField(max_length=255, blank=True, null=True)
    scorm_identifier = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Unik identifierare i SCORM-paketet"
    )

    class Meta:
        unique_together = ('course', 'language')

    def __str__(self):
        return f"{self.course.title} ({self.get_language_display()})"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)  # Spara objektet först

        if self.package_file:
            file_path = self.package_file.path
            print(f"Fil sökväg: {file_path}")  # Lägg till denna rad för loggning

            unpacked_dir_name = f"scorm_{self.course.id}_{self.language}_{self.id}"
            self.scorm_unpacked_dir = os.path.join(settings.MEDIA_ROOT, 'scorm_unpacked', unpacked_dir_name)
            Path(self.scorm_unpacked_dir).mkdir(parents=True, exist_ok=True)

            try:
                with zipfile.ZipFile(file_path, 'r') as zip_ref:
                    zip_ref.extractall(self.scorm_unpacked_dir)
                # self.extract_scorm_identifier()
            except zipfile.BadZipFile:
                self.scorm_unpacked_dir = None
                print(f"Fel: Kunde inte packa upp {self.package_file.name}")
            except FileNotFoundError:
                self.scorm_unpacked_dir = None
                print(f"Fel: Kunde inte hitta filen att packa upp: {file_path}")

        super().save(*args, **kwargs)
        
class Invitation(models.Model):
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    email = models.EmailField(null=True, blank=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='invitations_to_company')  # ÄNDRAD HÄR
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='invitations_sent_by')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    accepted = models.BooleanField(default=False)

    def __str__(self):
        return f"Inbjudan till {self.email or self.company} av {self.invited_by}"

    class Meta:
        verbose_name = "Inbjudan"
        verbose_name_plural = "Inbjudningar"