from django.urls import path
from . import views

urlpatterns = [
    path('', views.AnnouncementListCreateView.as_view(), name='announcement_list_create'),
    path('<int:pk>/', views.AnnouncementDetailView.as_view(), name='announcement_detail'),
]
