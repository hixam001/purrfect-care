"""
Purrfect Care — Models Package

Centralised re-exports so controllers can do:
    from app.models import UserCreate, CatResponse, OrderStatus, ...
"""

from app.models.user import (
    Role,
    UserBase, UserCreate, UserUpdate, UserResponse,
    UserLoginRequest, UserLoginResponse,
    UserProfileBase, UserProfileUpdate, UserProfileResponse,
)

from app.models.cat import (
    Gender, HistoryEntryType,
    CatBreedBase, CatBreedResponse,
    CatBase, CatCreate, CatUpdate, CatResponse,
    MedicalRecordBase, MedicalRecordUpdate, MedicalRecordResponse,
    PatientHistoryCreate, PatientHistoryResponse,
)

from app.models.vet import (
    VetBase, VetCreate, VetUpdate, VetResponse,
)

from app.models.hospital import (
    ServiceCategory,
    HospitalServiceBase, HospitalServiceCreate, HospitalServiceUpdate, HospitalServiceResponse,
    HospitalBase, HospitalCreate, HospitalUpdate, HospitalResponse,
)

from app.models.appointment import (
    AppointmentStatus,
    AppointmentSlotBase, AppointmentSlotCreate, AppointmentSlotResponse,
    AppointmentBase, AppointmentCreate, AppointmentUpdate, AppointmentResponse,
)

from app.models.medicine import (
    PrescriptionStatus,
    MedicineBase, MedicineCreate, MedicineUpdate, MedicineResponse,
    PrescriptionBase, PrescriptionCreate, PrescriptionUpdate, PrescriptionResponse,
)

from app.models.treatment import (
    TreatmentStatus,
    TreatmentBase, TreatmentCreate, TreatmentUpdate, TreatmentResponse,
)

from app.models.chat import (
    MessageType,
    ChatRoomCreate, ChatRoomResponse,
    MessageCreate, MessageResponse,
)

from app.models.store import (
    ProductCategoryBase, ProductCategoryCreate, ProductCategoryResponse,
    ProductBase, ProductCreate, ProductUpdate, ProductResponse,
    CatStoreBase, CatStoreCreate, CatStoreUpdate, CatStoreResponse,
)

from app.models.order import (
    OrderStatus,
    OrderItemCreate, OrderItemResponse,
    OrderCreate, OrderUpdate, OrderResponse,
)

from app.models.payment import (
    PaymentStatus,
    PaymentCreate, PaymentResponse, PaymentIntentResponse,
)

from app.models.review import (
    ReviewBase, ReviewCreate, ReviewResponse,
    ReviewResponseCreate, ReviewResponseResponse,
    OfferBase, OfferCreate, OfferUpdate, OfferResponse,
)

from app.models.notification import (
    NotificationChannel, NotificationType,
    NotificationCreate, NotificationResponse, NotificationMarkRead,
)

from app.models.ai import (
    SeverityLevel,
    IllnessRecordCreate, IllnessRecordResponse,
    AIConsultRequest, AIRecommendation, AIConsultationResponse,
)

__all__ = [
    # user
    "Role", "UserBase", "UserCreate", "UserUpdate", "UserResponse",
    "UserLoginRequest", "UserLoginResponse",
    "UserProfileBase", "UserProfileUpdate", "UserProfileResponse",
    # cat
    "Gender", "HistoryEntryType",
    "CatBreedBase", "CatBreedResponse",
    "CatBase", "CatCreate", "CatUpdate", "CatResponse",
    "MedicalRecordBase", "MedicalRecordUpdate", "MedicalRecordResponse",
    "PatientHistoryCreate", "PatientHistoryResponse",
    # vet
    "VetBase", "VetCreate", "VetUpdate", "VetResponse",
    # hospital
    "ServiceCategory",
    "HospitalServiceBase", "HospitalServiceCreate", "HospitalServiceUpdate", "HospitalServiceResponse",
    "HospitalBase", "HospitalCreate", "HospitalUpdate", "HospitalResponse",
    # appointment
    "AppointmentStatus",
    "AppointmentSlotBase", "AppointmentSlotCreate", "AppointmentSlotResponse",
    "AppointmentBase", "AppointmentCreate", "AppointmentUpdate", "AppointmentResponse",
    # medicine & prescription
    "PrescriptionStatus",
    "MedicineBase", "MedicineCreate", "MedicineUpdate", "MedicineResponse",
    "PrescriptionBase", "PrescriptionCreate", "PrescriptionUpdate", "PrescriptionResponse",
    # treatment
    "TreatmentStatus",
    "TreatmentBase", "TreatmentCreate", "TreatmentUpdate", "TreatmentResponse",
    # chat
    "MessageType",
    "ChatRoomCreate", "ChatRoomResponse",
    "MessageCreate", "MessageResponse",
    # store & products
    "ProductCategoryBase", "ProductCategoryCreate", "ProductCategoryResponse",
    "ProductBase", "ProductCreate", "ProductUpdate", "ProductResponse",
    "CatStoreBase", "CatStoreCreate", "CatStoreUpdate", "CatStoreResponse",
    # order
    "OrderStatus",
    "OrderItemCreate", "OrderItemResponse",
    "OrderCreate", "OrderUpdate", "OrderResponse",
    # payment
    "PaymentStatus",
    "PaymentCreate", "PaymentResponse", "PaymentIntentResponse",
    # review & offer
    "ReviewBase", "ReviewCreate", "ReviewResponse",
    "ReviewResponseCreate", "ReviewResponseResponse",
    "OfferBase", "OfferCreate", "OfferUpdate", "OfferResponse",
    # notification
    "NotificationChannel", "NotificationType",
    "NotificationCreate", "NotificationResponse", "NotificationMarkRead",
    # ai
    "SeverityLevel",
    "IllnessRecordCreate", "IllnessRecordResponse",
    "AIConsultRequest", "AIRecommendation", "AIConsultationResponse",
]
