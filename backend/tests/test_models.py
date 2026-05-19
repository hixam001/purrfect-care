"""
Tests for Pydantic model validation — ensures all models
accept valid data and reject invalid data correctly.
"""

import pytest
from pydantic import ValidationError

from app.models.user import Role, UserCreate, UserUpdate, UserResponse
from app.models.cat import CatCreate, CatUpdate, CatBreedResponse, MedicalRecordCreate
from app.models.vet import VetCreate, VetUpdate
from app.models.hospital import HospitalCreate, HospitalServiceCreate, SlotCreate
from app.models.appointment import AppointmentCreate, AppointmentStatus
from app.models.chat import MessageCreate, MessageType, ChatRoomCreate
from app.models.store import StoreCreate, ProductCreate, ProductCategoryCreate
from app.models.order import OrderCreate, OrderItemCreate, OrderStatus
from app.models.prescription import PrescriptionCreate, PrescriptionStatus
from app.models.medicine import MedicineCreate
from app.models.treatment import TreatmentCreate
from app.models.ai import AIConsultRequest, SeverityLevel, IllnessRecordCreate
from app.models.review import ReviewCreate
from app.models.offer import OfferCreate
from app.models.payment import PaymentStatus
from app.models.notification import NotificationType, NotificationChannel


class TestRoleEnum:
    def test_all_roles_exist(self):
        assert Role.CAT_OWNER == "cat_owner"
        assert Role.VET == "vet"
        assert Role.HOSPITAL_ADMIN == "hospital_admin"
        assert Role.STORE_OWNER == "store_owner"
        assert Role.ADMIN == "admin"

    def test_role_count(self):
        assert len(Role) == 5


class TestUserModels:
    def test_valid_user_create(self):
        user = UserCreate(
            name="John Smith",
            email="john@example.com",
            password="password123",
        )
        assert user.name == "John Smith"
        assert user.role == Role.CAT_OWNER  # default

    def test_user_create_with_role(self):
        user = UserCreate(
            name="Dr. Sarah",
            email="sarah@vet.com",
            password="securepass",
            role=Role.VET,
        )
        assert user.role == Role.VET

    def test_user_create_rejects_short_password(self):
        with pytest.raises(ValidationError):
            UserCreate(name="Test", email="t@t.com", password="short")

    def test_user_create_rejects_invalid_email(self):
        with pytest.raises(ValidationError):
            UserCreate(name="Test", email="not-an-email", password="password123")

    def test_user_create_rejects_empty_name(self):
        with pytest.raises(ValidationError):
            UserCreate(name="", email="t@t.com", password="password123")

    def test_user_update_all_optional(self):
        update = UserUpdate()  # All fields optional
        assert update.name is None

    def test_user_create_with_location(self):
        user = UserCreate(
            name="Test",
            email="t@t.com",
            password="password123",
            latitude=40.71,
            longitude=-74.00,
        )
        assert user.latitude == 40.71

    def test_user_create_rejects_invalid_latitude(self):
        with pytest.raises(ValidationError):
            UserCreate(
                name="Test", email="t@t.com", password="password123",
                latitude=100.0,  # max is 90
            )


class TestCatModels:
    def test_valid_cat_create(self):
        cat = CatCreate(name="Whiskers", gender="male", age_months=24)
        assert cat.name == "Whiskers"
        assert cat.is_neutered is False  # default

    def test_cat_create_rejects_invalid_gender(self):
        with pytest.raises(ValidationError):
            CatCreate(name="Cat", gender="unknown")

    def test_cat_create_rejects_negative_age(self):
        with pytest.raises(ValidationError):
            CatCreate(name="Cat", age_months=-1)

    def test_cat_update_all_optional(self):
        update = CatUpdate()
        assert update.name is None

    def test_medical_record_defaults(self):
        record = MedicalRecordCreate()
        assert record.allergies == []
        assert record.existing_conditions == []


class TestVetModels:
    def test_valid_vet_create(self):
        vet = VetCreate(license_number="VET-2024-001")
        assert vet.license_number == "VET-2024-001"

    def test_vet_create_rejects_empty_license(self):
        with pytest.raises(ValidationError):
            VetCreate(license_number="")


class TestHospitalModels:
    def test_valid_hospital_create(self):
        hospital = HospitalCreate(
            name="Paws Clinic",
            address="123 Main St",
            latitude=40.71,
            longitude=-74.00,
        )
        assert hospital.name == "Paws Clinic"

    def test_hospital_service_create(self):
        service = HospitalServiceCreate(
            name="General Checkup",
            price=45.00,
            duration_minutes=30,
        )
        assert service.price == 45.00

    def test_hospital_service_rejects_negative_price(self):
        with pytest.raises(ValidationError):
            HospitalServiceCreate(name="Test", price=-10.00)


class TestAppointmentModels:
    def test_valid_appointment_create(self):
        appt = AppointmentCreate(
            hospital_id="h1",
            vet_id="v1",
            service_id="s1",
            slot_id="sl1",
            cat_id="c1",
        )
        assert appt.hospital_id == "h1"

    def test_appointment_status_values(self):
        assert AppointmentStatus.PENDING == "pending"
        assert AppointmentStatus.CONFIRMED == "confirmed"
        assert AppointmentStatus.COMPLETED == "completed"
        assert AppointmentStatus.CANCELLED == "cancelled"
        assert len(AppointmentStatus) == 6


class TestChatModels:
    def test_valid_message_create(self):
        msg = MessageCreate(content="Hello, how is my cat?")
        assert msg.message_type == MessageType.TEXT  # default
        assert msg.media_url is None

    def test_message_rejects_empty_content(self):
        with pytest.raises(ValidationError):
            MessageCreate(content="")

    def test_message_type_values(self):
        assert MessageType.TEXT == "text"
        assert MessageType.IMAGE == "image"
        assert MessageType.PRESCRIPTION_SHARE == "prescription_share"
        assert len(MessageType) == 4


class TestStoreModels:
    def test_valid_store_create(self):
        store = StoreCreate(
            name="Kitty Kingdom",
            address="456 Oak Ave",
            latitude=34.05,
            longitude=-118.24,
        )
        assert store.delivery_fee == 0  # default

    def test_valid_product_create(self):
        product = ProductCreate(
            name="Premium Cat Food",
            price=12.99,
            stock_quantity=100,
        )
        assert product.is_active is True

    def test_product_rejects_negative_stock(self):
        with pytest.raises(ValidationError):
            ProductCreate(name="Test", price=10.0, stock_quantity=-5)


class TestOrderModels:
    def test_valid_order_create(self):
        order = OrderCreate(
            store_id="s1",
            items=[OrderItemCreate(product_id="p1", quantity=2)],
            delivery_address="123 Main St",
        )
        assert len(order.items) == 1
        assert order.items[0].quantity == 2

    def test_order_rejects_empty_items(self):
        with pytest.raises(ValidationError):
            OrderCreate(store_id="s1", items=[], delivery_address="123 Main St")

    def test_order_item_rejects_zero_quantity(self):
        with pytest.raises(ValidationError):
            OrderItemCreate(product_id="p1", quantity=0)

    def test_order_status_lifecycle(self):
        statuses = [s.value for s in OrderStatus]
        assert "pending" in statuses
        assert "preparing" in statuses
        assert "delivered" in statuses
        assert "cancelled" in statuses
        assert len(OrderStatus) == 8


class TestPrescriptionModels:
    def test_valid_prescription_create(self):
        rx = PrescriptionCreate(
            cat_id="c1",
            medicine_id="m1",
            dosage="5mg",
            frequency="twice daily",
            duration_days=7,
        )
        assert rx.duration_days == 7

    def test_prescription_rejects_zero_duration(self):
        with pytest.raises(ValidationError):
            PrescriptionCreate(
                cat_id="c1", medicine_id="m1",
                dosage="5mg", frequency="daily", duration_days=0,
            )


class TestMedicineModels:
    def test_valid_medicine_create(self):
        med = MedicineCreate(name="Amoxicillin")
        assert med.requires_prescription is True  # Safety default per doc 08
        assert med.allergy_warnings == []


class TestAIModels:
    def test_valid_consult_request(self):
        req = AIConsultRequest(symptoms="My cat is vomiting and lethargic for 2 days")
        assert len(req.symptoms) >= 10

    def test_consult_rejects_short_symptoms(self):
        with pytest.raises(ValidationError):
            AIConsultRequest(symptoms="sick")  # too short

    def test_severity_levels(self):
        assert SeverityLevel.LOW == "low"
        assert SeverityLevel.CRITICAL == "critical"
        assert len(SeverityLevel) == 4

    def test_valid_illness_record_create(self):
        illness = IllnessRecordCreate(
            illness_name="Feline Upper Respiratory Infection",
            description="A common respiratory illness in cats",
            symptoms=["sneezing", "nasal discharge"],
            severity_level=SeverityLevel.MODERATE,
        )
        assert len(illness.symptoms) == 2


class TestReviewModels:
    def test_valid_review_create(self):
        review = ReviewCreate(hospital_id="h1", rating=5, comment="Great service!")
        assert review.rating == 5

    def test_review_rejects_rating_zero(self):
        with pytest.raises(ValidationError):
            ReviewCreate(hospital_id="h1", rating=0)

    def test_review_rejects_rating_six(self):
        with pytest.raises(ValidationError):
            ReviewCreate(hospital_id="h1", rating=6)


class TestOfferModels:
    def test_valid_offer_create(self):
        from datetime import datetime, timedelta
        offer = OfferCreate(
            hospital_id="h1",
            title="Summer Special",
            discount_percent=20.0,
            valid_from=datetime.now(),
            valid_to=datetime.now() + timedelta(days=30),
        )
        assert offer.discount_percent == 20.0

    def test_offer_rejects_negative_discount(self):
        from datetime import datetime, timedelta
        with pytest.raises(ValidationError):
            OfferCreate(
                title="Bad Offer",
                discount_percent=-5.0,
                valid_from=datetime.now(),
                valid_to=datetime.now() + timedelta(days=30),
            )


class TestPaymentModels:
    def test_payment_status_values(self):
        assert PaymentStatus.PENDING == "pending"
        assert PaymentStatus.COMPLETED == "completed"
        assert PaymentStatus.REFUNDED == "refunded"


class TestNotificationModels:
    def test_notification_types_count(self):
        # 9 core types from Doc 07 + 5 extended types
        assert len(NotificationType) == 14

    def test_notification_channels(self):
        assert NotificationChannel.PUSH == "push"
        assert NotificationChannel.EMAIL == "email"
        assert NotificationChannel.SMS == "sms"
