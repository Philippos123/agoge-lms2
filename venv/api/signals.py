import os
import zipfile
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
import logging
from .models import CourseToBuy

logger = logging.getLogger(__name__)

def unpack_scorm_file(course):
    try:
        print(f"unpack_scorm_file anropad för kurs {course.id}")
        zip_path = course.scorm_file.path
        print(f"zip_path: {zip_path}")

        extract_path = os.path.join(settings.MEDIA_ROOT, 'scorm_unpacked', str(course.id))
        print(f"extract_path: {extract_path}")

        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)

        course.scorm_unpacked_dir = extract_path
        # Använd update_fields för att förhindra att post_save-signalen körs.
        CourseToBuy.objects.filter(pk=course.pk).update(scorm_unpacked_dir=extract_path)
        print(f"scorm_unpacked_dir: {course.scorm_unpacked_dir}")
        logger.info(f"SCORM-fil uppackad till: {extract_path}")
    except Exception as e:
        print(f"Fel vid uppackning: {e}")
        logger.error(f"Fel vid uppackning av SCORM-fil: {e}")

@receiver(post_save, sender=CourseToBuy)
def course_post_save(sender, instance, **kwargs):
    print(f"course_post_save anropad för kurs {instance.id}")
    print(f"instance.scorm_file: {instance.scorm_file}")
    if instance.scorm_file:
        unpack_scorm_file(instance)