from django.apps import AppConfig
class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        print("api.ready() körs") # debug
        import api.signals