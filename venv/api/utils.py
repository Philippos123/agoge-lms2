from django.core.exceptions import ValidationError

def validate_file_size(max_size):
    def validator(file):
        if file.size > max_size:
            raise ValidationError(f"Filen får inte vara större än {max_size//1024//1024}MB")
    return validator