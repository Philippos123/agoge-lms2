from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.forms import ModelForm, ChoiceField, MultipleChoiceField
from .models import ( User, Company, CourseToBuy, CompanyCourse, UserScormStatus,  Language, Order, LanguageOption, ScormPackage
                     )

# Inline för att hantera företagets inställningar i CompanyAdmin


# Inline för att hantera kurser tilldelade företag (både beställda och köpta)


# Admin för Company-modellen


# Anpassad admin för User-modellen
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'company', 'is_admin', 'is_staff', 'profile_img',)
    list_filter = ('company', 'is_admin', 'is_staff')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'profile_img')}),
        ('Company info', {'fields': ('company', 'is_admin')}),  # Hanterar företagets koppling
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),  # Användarbehörigheter
        ('Important dates', {'fields': ('last_login', 'date_joined')}),  # Inloggning och registrering
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'profile_img', 'company', 'is_admin', 'is_staff', 'is_superuser'),
        }),
    )
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)



# Admin för CourseToBuy-modellen (kurser som kan köpas)
class ScormPackageInline(admin.TabularInline):
    model = ScormPackage
    extra = 1
    verbose_name = 'SCORM Paket'
    verbose_name_plural = 'SCORM Paket (per språk)'

# Admin för CourseToBuy-modellen
class CourseToBuyAdmin(admin.ModelAdmin):
    list_display = ('title', 'price', 'language', 'language_icon', 'get_bransch_typ_display', 'company_count', 'has_scorm_packages', 'is_marketplace') # Uppdaterad list_display
    list_filter = ('language',)
    search_fields = ('title', 'description')
    readonly_fields = ('language_icon', 'company_count', 'has_scorm_packages') # Uppdaterad readonly_fields
    inlines = [ScormPackageInline]

    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'img', 'price', 'time_to_complete', 'language', 'bransch_typ', 'is_marketplace') # 'scorm_file' och 'scorm_identifier' borttagna här
        }),
        ('Statistik', {
            'fields': ('language_icon', 'company_count', 'has_scorm_packages'), # Uppdaterad fält
            'classes': ('wide',)
        }),
    )

    def company_count(self, obj):
        return obj.company_courses.count()
    company_count.short_description = 'Antal företag'

    def has_scorm_packages(self, obj):
        return obj.scorm_packages.exists()
    has_scorm_packages.boolean = True
    has_scorm_packages.short_description = 'Har SCORM-paket'


# Admin för Course-modellen (kurser som tilldelas företag)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'creator', 'course_to_buy')
    search_fields = ('title', 'creator__name')
    list_filter = ('creator',)

    fieldsets = (
        (None, {
            'fields': ('title', 'creator', 'course_to_buy')  # Koppling till företag och köpta kurser
        }),
    )

# Admin för CompanyCourse-modellen (koppling mellan företag och deras kurser)
class CompanyCourseForm(ModelForm):
    available_languages = MultipleChoiceField(
        choices=[],  # Initialt tomma val
        widget=admin.widgets.FilteredSelectMultiple('Tillgängliga språk', is_stacked=False),
        required=False,
        help_text="Välj de språk som företaget ska ha tillgång till för denna kurs."
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'instance' in kwargs and kwargs['instance'] and kwargs['instance'].course:
            course = kwargs['instance'].course
            available_packages = ScormPackage.objects.filter(course=course)
            language_choices = [(pkg.language, pkg.get_language_display()) for pkg in available_packages]
            self.fields['available_languages'].choices = language_choices
        elif 'data' in self.data and 'course' in self.data and self.data['course']:
            try:
                course_id = int(self.data['course'])
                course = CourseToBuy.objects.get(pk=course_id)
                available_packages = ScormPackage.objects.filter(course=course)
                language_choices = [(pkg.language, pkg.get_language_display()) for pkg in available_packages]
                self.fields['available_languages'].choices = language_choices
            except (ValueError, CourseToBuy.DoesNotExist):
                pass

    class Meta:
        model = CompanyCourse
        fields = '__all__'
        widgets = {
            'company': admin.widgets.ForeignKeyRawIdWidget(CompanyCourse._meta.get_field('company').remote_field, admin.site),
            'course': admin.widgets.ForeignKeyRawIdWidget(CompanyCourse._meta.get_field('course').remote_field, admin.site),
        }


class CompanyCourseInline(admin.TabularInline):
    model = CompanyCourse
    extra = 1
    verbose_name = 'Kurs'
    verbose_name_plural = 'Kurser'
    form = CompanyCourseForm  # Denna rad är viktig!
    
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'course_count', 'created_at', 'updated_at')
    search_fields = ('name',)
    inlines = [CompanyCourseInline]

    def course_count(self, obj):
        return obj.company_courses.count()
    course_count.short_description = 'Antal kurser'
    
# Admin för CompanyCourse-modellen (koppling mellan företag och deras kurser)
class CompanyCourseAdmin(admin.ModelAdmin):
    list_display = ('company', 'course', 'is_ordered', 'display_available_languages')
    list_filter = ('is_ordered',)
    search_fields = ('company__name', 'course__title')
    form = CompanyCourseForm  # Koppla det anpassade formuläret
    fieldsets = (
        (None, {
            'fields': ('company', 'course', 'is_ordered', 'available_languages')  # Inkludera fältet
        }),
    )

    def display_available_languages(self, obj):
        return ", ".join([dict(CourseToBuy.LanguageChoices.choices).get(lang, lang) for lang in obj.available_languages])
    display_available_languages.short_description = 'Tillgängliga språk'


class LanguageOptionAdmin(admin.ModelAdmin):
    list_display = ('label', 'value', 'price')
    ordering = ('label',)

admin.site.register(LanguageOption, LanguageOptionAdmin)
# ... (resten av dina admin-registreringar)

class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'course', 'company' ) # Visa dessa fält i listan
    # search_fields = ('id', 'course__title', 'company__name') # Lägg till sökfunktion

admin.site.register(Order, OrderAdmin)
admin.site.register(CourseToBuy, CourseToBuyAdmin)
admin.site.register(User, CustomUserAdmin)
admin.site.register(Company, CompanyAdmin)
admin.site.register(CompanyCourse, CompanyCourseAdmin)  # Registrera CompanyCourse för att hantera kopplingar mellan företag och kurser
