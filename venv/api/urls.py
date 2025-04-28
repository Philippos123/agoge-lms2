from django.urls import path, include
from django.conf import settings
from . import views
from rest_framework.decorators import action
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . views import (
    CustomTokenObtainPairView,
    UserViewSet,
    CompanyViewSet,
    CourseToBuyListView,
    CourseToBuyDetail,
    TeamListView,
    invite_member, 
    remove_member,
    LogoutView,
    user_courses,
    get_scorm_url,
    get_scorm_launch_data,
    CourseToBuySerializer,
    CompanyDocumentViewSet,
    LanguageOptionListView,
    get_available_languages,
    CompanyDashboardAPIView,
)



router = DefaultRouter()
router.register(r'user', UserViewSet, basename='user')
router.register(r'company', CompanyViewSet, basename='company')
# router.register(r'company/documents', views.CompanyDocumentViewSet, basename='company-document')


urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('coursetobuy/', CourseToBuyListView.as_view(), name='coursetobuy-list'),
    path('coursetobuy/<int:pk>/', CourseToBuyDetail.as_view(), name='course-detail'),
    path('coursetobuy/<int:pk>/scorm/', get_scorm_url, name='scorm-url'),
    path('coursetobuy/<int:pk>/available_languages/', views.get_available_languages, name='course-available-languages'),
    path('coursetobuy/<int:pk>/scorm/launch/<str:language_code>/', views.get_scorm_launch_data, name='scorm-launch-data-with-lang'),
    path("logout/", LogoutView.as_view(), name="logout"),
    path('register/', views.register_user, name='register_user'),
    path('team/', TeamListView.as_view(), name='team-list'),
    path("team/invite/", invite_member, name="invite-member"),
    path("team/remove/<int:user_id>/", remove_member, name="remove-member"),
    path('accept-invite/<uuid:token>/', views.accept_invite_view, name='accept-invite'),
    path('user/courses/', user_courses, name='user-courses'),
    path('company/documents/', views.CompanyDocumentViewSet.as_view({'get': 'list', 'post': 'create'}), name='company-document-list'),
    path('company/documents/<int:pk>/', views.CompanyDocumentViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='company-document-detail'),
    path('orders/', views.OrderViewSet.as_view({'post': 'create'}), name='order-create'), # Lägg till order-endpoint med path för create
    path('languages/', LanguageOptionListView.as_view(), name='language-options-list'), # Lägg till den nya rutten
    path('company/dashboard/', views.CompanyDashboardAPIView.as_view(), name='company-dashboard'),



    path('', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)