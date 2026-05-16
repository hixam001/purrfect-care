# 06 — Partial Class Diagrams

> Partial class diagrams are derived from each sequence diagram's transaction sets + interfaces.
> Each partial diagram shows only the classes and relationships relevant to one use case.

---

## Partial Class Diagram 1: User Registration (from SD-1, TS-1)

```mermaid
classDiagram
    class RegistrationView {
        -formData: RegistrationForm
        +render(): JSX
        +validateForm(): boolean
        +handleSubmit(): void
        +handleError(error): void
    }

    class AuthController {
        -authService: AuthService
        +register(req, res): Response
        +login(req, res): Response
        +logout(req, res): Response
        +validateRequest(schema, data): boolean
    }

    class AuthService {
        -userRepo: UserRepository
        -supabaseAuth: SupabaseAuth
        -notificationService: NotificationService
        +register(userData): UserWithToken
        +login(email, password): UserWithToken
        +verifyToken(token): DecodedToken
        +refreshToken(token): string
    }

    class UserRepository {
        -db: SupabaseClient
        +createProfile(userId, data): User
        +findByEmail(email): User
        +findById(id): User
        +update(id, data): User
        +delete(id): boolean
    }

    class User {
        +id: UUID
        +email: string
        +password_hash: string
        +name: string
        +phone: string
        +role: Role
        +avatar_url: string
        +location: Point
        +address: string
        +city: string
        +is_active: boolean
        +created_at: DateTime
    }

    class UserProfile {
        +id: UUID
        +user_id: UUID
        +preferences: JSON
        +notification_settings: string
        +payment_customer_id: string
        +last_login: DateTime
    }

    class NotificationService {
        +sendWelcomeEmail(email, name): void
        +sendPushNotification(userId, payload): void
        +sendSMS(phone, message): void
    }

    RegistrationView --> AuthController : HTTP POST
    AuthController --> AuthService : register()
    AuthService --> UserRepository : createProfile()
    AuthService --> NotificationService : sendWelcomeEmail()
    UserRepository ..> User : creates
    UserRepository ..> UserProfile : creates
    User "1" --> "1" UserProfile : has
```

---

## Partial Class Diagram 2: Cat Registration (from SD-2, TS-2)

```mermaid
classDiagram
    class CatRegistrationView {
        -catForm: CatForm
        -breedOptions: CatBreed[]
        +render(): JSX
        +handleBreedSelect(breedId): void
        +handleSubmit(): void
    }

    class CatController {
        -catService: CatService
        +register(req, res): Response
        +getByOwner(req, res): Response
        +getById(req, res): Response
        +update(req, res): Response
        +delete(req, res): Response
    }

    class CatService {
        -catRepo: CatRepository
        -breedRepo: BreedRepository
        -medicalRecordRepo: MedicalRecordRepo
        +registerCat(userId, catData): CatWithRecord
        +getCatsByOwner(userId): Cat[]
        +getCatProfile(catId): CatProfile
        +updateCat(catId, data): Cat
    }

    class CatRepository {
        -db: SupabaseClient
        +create(catData): Cat
        +findByOwner(ownerId): Cat[]
        +findById(id): Cat
        +update(id, data): Cat
        +delete(id): boolean
    }

    class BreedRepository {
        -db: SupabaseClient
        +findById(id): CatBreed
        +findAll(): CatBreed[]
        +search(query): CatBreed[]
    }

    class MedicalRecordRepo {
        -db: SupabaseClient
        +createInitialRecord(catId, data): MedicalRecord
        +findByCat(catId): MedicalRecord
        +update(id, data): MedicalRecord
        +getAllergies(catId): string[]
    }

    class Cat {
        +id: UUID
        +owner_id: UUID
        +name: string
        +breed_id: UUID
        +age_months: int
        +weight_kg: float
        +color: string
        +gender: string
        +photo_url: string
        +is_neutered: boolean
        +microchip_id: string
        +registered_at: DateTime
    }

    class CatBreed {
        +id: UUID
        +name: string
        +origin_country: string
        +size_category: string
        +coat_type: string
        +temperament: string
        +description: string
        +avg_lifespan_years: float
        +avg_weight_kg: float
        +common_health_issues: string[]
        +image_url: string
    }

    class MedicalRecord {
        +id: UUID
        +cat_id: UUID
        +allergies: string[]
        +existing_conditions: string[]
        +vaccination_status: JSON
        +blood_type: string
        +notes: string
    }

    CatRegistrationView --> CatController : HTTP POST
    CatController --> CatService : registerCat()
    CatService --> CatRepository : create()
    CatService --> BreedRepository : findById()
    CatService --> MedicalRecordRepo : createInitialRecord()
    CatRepository ..> Cat : creates
    BreedRepository ..> CatBreed : reads
    MedicalRecordRepo ..> MedicalRecord : creates
    Cat "1" --> "1" CatBreed : is of
    Cat "1" --> "1" MedicalRecord : has
```

---

## Partial Class Diagram 3: Appointment Booking (from SD-3, SD-4, TS-3)

```mermaid
classDiagram
    class HospitalListView {
        -hospitals: Hospital[]
        -userLocation: Point
        +render(): JSX
        +handleSearch(filters): void
        +handleSelectHospital(id): void
    }

    class BookAppointmentView {
        -selectedService: HospitalService
        -selectedVet: Vet
        -selectedSlot: AppointmentSlot
        -selectedCat: Cat
        +render(): JSX
        +handlePayment(clientSecret): void
        +handleConfirm(): void
    }

    class AppointmentController {
        -appointmentService: AppointmentService
        +getNearbyHospitals(req, res): Response
        +getHospitalDetails(req, res): Response
        +createAppointment(req, res): Response
        +confirmAppointment(req, res): Response
        +cancelAppointment(req, res): Response
        +getUserAppointments(req, res): Response
    }

    class AppointmentService {
        -appointmentRepo: AppointmentRepository
        -slotRepo: SlotRepository
        -hospitalRepo: HospitalRepository
        -stripeGateway: StripeGateway
        -notificationService: NotificationService
        +findNearbyHospitals(lat, lng, radius): Hospital[]
        +getHospitalDetails(id): HospitalDetail
        +createAppointment(userId, data): AppointmentPreview
        +confirmAppointment(id, paymentId): Appointment
        +cancelAppointment(id): boolean
    }

    class AppointmentRepository {
        -db: SupabaseClient
        +create(data): Appointment
        +findById(id): Appointment
        +findByUser(userId): Appointment[]
        +findByVet(vetId): Appointment[]
        +findByHospital(hospitalId): Appointment[]
        +updateStatus(id, status): Appointment
    }

    class SlotRepository {
        -db: SupabaseClient
        +checkAvailability(slotId): boolean
        +markBooked(slotId): void
        +markAvailable(slotId): void
        +findByVetAndDate(vetId, date): AppointmentSlot[]
    }

    class HospitalRepository {
        -db: SupabaseClient
        +findByRadius(lat, lng, radius): Hospital[]
        +findById(id): Hospital
        +findByAdmin(adminUserId): Hospital
        +updatePageConfig(id, config): Hospital
    }

    class StripeGateway {
        -stripeClient: Stripe
        +createPaymentIntent(amount, currency): PaymentIntent
        +confirmPayment(intentId): PaymentConfirmation
        +refundPayment(intentId): Refund
    }

    class Hospital {
        +id: UUID
        +admin_user_id: UUID
        +name: string
        +description: string
        +phone: string
        +email: string
        +location: Point
        +address: string
        +banner_url: string
        +operating_hours: JSON
        +is_active: boolean
        +is_approved: boolean
        +rating: float
        +page_config: JSON
    }

    class HospitalService {
        +id: UUID
        +hospital_id: UUID
        +name: string
        +description: string
        +category: string
        +price: float
        +duration_minutes: int
        +is_active: boolean
    }

    class AppointmentSlot {
        +id: UUID
        +hospital_id: UUID
        +vet_id: UUID
        +slot_date: Date
        +start_time: Time
        +end_time: Time
        +is_booked: boolean
    }

    class Appointment {
        +id: UUID
        +user_id: UUID
        +cat_id: UUID
        +vet_id: UUID
        +hospital_id: UUID
        +service_id: UUID
        +slot_id: UUID
        +appointment_date: DateTime
        +status: AppointmentStatus
        +notes: string
        +amount_paid: float
        +payment_id: string
    }

    class Vet {
        +id: UUID
        +user_id: UUID
        +license_number: string
        +specialization: string
        +experience_years: int
        +bio: string
        +hospital_id: UUID
        +is_verified: boolean
        +rating: float
    }

    HospitalListView --> AppointmentController : GET nearby
    BookAppointmentView --> AppointmentController : POST/PUT
    AppointmentController --> AppointmentService : business logic
    AppointmentService --> AppointmentRepository : CRUD
    AppointmentService --> SlotRepository : slot mgmt
    AppointmentService --> HospitalRepository : hospital queries
    AppointmentService --> StripeGateway : payment
    AppointmentService --> NotificationService : notify
    Hospital "1" --> "*" HospitalService : offers
    Hospital "1" --> "*" AppointmentSlot : has
    Hospital "1" --> "*" Vet : employs
    Appointment --> Hospital : at
    Appointment --> Vet : with
    Appointment --> AppointmentSlot : for slot
    Appointment --> HospitalService : for service
```

---

## Partial Class Diagram 4: Vet-User Chat (from SD-5, TS-5)

```mermaid
classDiagram
    class UserChatView {
        -chatRoom: ChatRoom
        -messages: Message[]
        -realtimeSubscription: Subscription
        +render(): JSX
        +sendMessage(content): void
        +loadMore(): void
        +subscribe(channelId): void
    }

    class VetChatView {
        -chatRooms: ChatRoom[]
        -activeChat: ChatRoom
        -messages: Message[]
        +render(): JSX
        +sendMessage(content): void
        +switchChat(roomId): void
    }

    class ChatController {
        -chatService: ChatService
        +getOrCreateChat(req, res): Response
        +getMessages(req, res): Response
        +sendMessage(req, res): Response
        +getChatRooms(req, res): Response
        +markRead(req, res): Response
    }

    class ChatService {
        -chatRepo: ChatRepository
        -messageRepo: MessageRepository
        -notificationService: NotificationService
        +getOrCreateChatRoom(userId, vetId): ChatRoom
        +getMessages(chatRoomId, page): Message[]
        +sendMessage(chatRoomId, senderId, content, type): Message
        +getChatRooms(userId, role): ChatRoom[]
        +markAsRead(chatRoomId, userId): void
        +notifyIfOffline(recipientId, message): void
    }

    class ChatRepository {
        -db: SupabaseClient
        +findByParticipants(userId, vetId): ChatRoom
        +create(userId, vetId): ChatRoom
        +updateLastMessage(id, timestamp): void
        +incrementUnread(id, field): void
        +findByUser(userId): ChatRoom[]
    }

    class MessageRepository {
        -db: SupabaseClient
        +create(chatRoomId, senderId, content, type): Message
        +findByChatRoom(chatRoomId, limit, offset): Message[]
        +markRead(chatRoomId, userId): void
    }

    class ChatRoom {
        +id: UUID
        +user_id: UUID
        +vet_id: UUID
        +last_message_at: DateTime
        +unread_user: int
        +unread_vet: int
        +is_active: boolean
    }

    class Message {
        +id: UUID
        +chat_room_id: UUID
        +sender_id: UUID
        +content: string
        +message_type: MessageType
        +media_url: string
        +is_read: boolean
        +sent_at: DateTime
    }

    UserChatView --> ChatController : HTTP
    VetChatView --> ChatController : HTTP
    ChatController --> ChatService : business logic
    ChatService --> ChatRepository : room mgmt
    ChatService --> MessageRepository : message mgmt
    ChatService --> NotificationService : offline alerts
    ChatRoom "1" --> "*" Message : contains
    ChatRepository ..> ChatRoom : manages
    MessageRepository ..> Message : manages
```

---

## Partial Class Diagram 5: AI Companion (from SD-6, TS-7)

```mermaid
classDiagram
    class AICompanionView {
        -messages: ChatMessage[]
        -isLoading: boolean
        +render(): JSX
        +handleSymptomInput(text): void
        +displayRecommendation(result): void
        +handleBookAppointment(): void
    }

    class AIController {
        -aiService: AIService
        +consult(req, res): Response
        +getHistory(req, res): Response
    }

    class AIService {
        -catRepo: CatRepository
        -embeddingService: EmbeddingService
        -vectorDBRepo: VectorDBRepository
        -illnessRepo: IllnessRepository
        -consultLogRepo: ConsultationLogRepo
        +consult(userId, catId, symptoms): AIRecommendation
        +filterByBreed(illnesses, breed): Illness[]
        +calculateSeverity(matches, context): SeverityLevel
        +generateRecommendation(illnesses, context): string
    }

    class EmbeddingService {
        -openaiClient: OpenAI
        +generateEmbedding(text): float[]
        +batchEmbed(texts): float[][]
    }

    class VectorDBRepository {
        -db: SupabaseClient
        +similaritySearch(vector, limit): VectorMatch[]
        +store(id, vector): void
        +update(id, vector): void
        +delete(id): void
    }

    class IllnessRepository {
        -db: SupabaseClient
        +findByIds(ids): IllnessRecord[]
        +findAll(): IllnessRecord[]
        +create(data): IllnessRecord
        +update(id, data): IllnessRecord
    }

    class ConsultationLogRepo {
        -db: SupabaseClient
        +logConsultation(userId, catId, query, results): AIConsultation
        +findByUser(userId): AIConsultation[]
        +findByCat(catId): AIConsultation[]
    }

    class IllnessRecord {
        +id: UUID
        +illness_name: string
        +description: string
        +symptoms: string[]
        +affected_breeds: string[]
        +severity_level: string
        +home_remedies: string
        +when_to_see_vet: string
        +related_medicines: string[]
        +embedding: vector
    }

    class AIConsultation {
        +id: UUID
        +user_id: UUID
        +cat_id: UUID
        +query_text: string
        +results: JSON
        +confidence_score: float
        +severity: string
        +created_at: DateTime
    }

    class AIRecommendation {
        +illnesses: Illness[]
        +remedies: string[]
        +severity: SeverityLevel
        +confidence: float
        +seeVet: boolean
        +relatedMedicines: Medicine[]
    }

    AICompanionView --> AIController : HTTP POST
    AIController --> AIService : consult()
    AIService --> EmbeddingService : generateEmbedding()
    AIService --> VectorDBRepository : similaritySearch()
    AIService --> IllnessRepository : findByIds()
    AIService --> ConsultationLogRepo : logConsultation()
    AIService ..> AIRecommendation : returns
    VectorDBRepository ..> IllnessRecord : queries
    ConsultationLogRepo ..> AIConsultation : creates
```

---

## Partial Class Diagram 6: Prescription (from SD-7, TS-6)

```mermaid
classDiagram
    class AppointmentDetailView {
        -appointment: Appointment
        -patientHistory: PatientHistory[]
        -medicineSearch: Medicine[]
        +render(): JSX
        +searchMedicine(query): void
        +prescribeMedicine(data): void
        +addNotes(notes): void
    }

    class PrescriptionController {
        -prescriptionService: PrescriptionService
        +getContext(req, res): Response
        +prescribe(req, res): Response
        +searchMedicines(req, res): Response
        +getPrescriptionHistory(req, res): Response
    }

    class PrescriptionService {
        -prescriptionRepo: PrescriptionRepository
        -medicineRepo: MedicineRepository
        -medicalRecordRepo: MedicalRecordRepo
        -patientHistoryRepo: PatientHistoryRepo
        -notificationService: NotificationService
        +prescribe(vetId, data): Prescription
        +checkContraindications(catId, medicineId): ContraindicationResult
        +getAppointmentContext(appointmentId): AppointmentContext
    }

    class PrescriptionRepository {
        -db: SupabaseClient
        +create(data): Prescription
        +findByAppointment(appointmentId): Prescription[]
        +findByCat(catId): Prescription[]
        +findByVet(vetId): Prescription[]
    }

    class MedicineRepository {
        -db: SupabaseClient
        +search(query): Medicine[]
        +findById(id): Medicine
        +findAll(page, limit): Medicine[]
        +create(data): Medicine
        +update(id, data): Medicine
        +getContraindications(id): ContraindicationInfo
    }

    class PatientHistoryRepo {
        -db: SupabaseClient
        +addEntry(catId, type, data): PatientHistory
        +findByCat(catId): PatientHistory[]
        +findByAppointment(appointmentId): PatientHistory[]
    }

    class Prescription {
        +id: UUID
        +appointment_id: UUID
        +cat_id: UUID
        +vet_id: UUID
        +medicine_id: UUID
        +dosage: string
        +frequency: string
        +duration_days: int
        +instructions: string
        +status: PrescriptionStatus
        +prescribed_at: DateTime
    }

    class Medicine {
        +id: UUID
        +name: string
        +generic_name: string
        +manufacturer: string
        +ingredients: string[]
        +dosage_form: string
        +description: string
        +usage_instructions: string
        +contraindications: string[]
        +allergy_warnings: string[]
        +breed_warnings: string[]
        +side_effects: string[]
        +requires_prescription: boolean
        +embedding: vector
    }

    class PatientHistory {
        +id: UUID
        +cat_id: UUID
        +entry_type: string
        +description: string
        +appointment_id: UUID
        +prescription_id: UUID
        +vet_id: UUID
        +created_at: DateTime
    }

    AppointmentDetailView --> PrescriptionController : HTTP
    PrescriptionController --> PrescriptionService : prescribe()
    PrescriptionService --> PrescriptionRepository : create()
    PrescriptionService --> MedicineRepository : search/get()
    PrescriptionService --> MedicalRecordRepo : getAllergies()
    PrescriptionService --> PatientHistoryRepo : addEntry()
    PrescriptionService --> NotificationService : notifyOwner()
    Prescription --> Medicine : references
    PatientHistory --> Prescription : logs
```

---

## Partial Class Diagram 7: Cat Store & Orders (from SD-8, TS-4, TS-9, TS-12)

```mermaid
classDiagram
    class StoreListView {
        -stores: CatStore[]
        -location: Point
        +render(): JSX
        +handleSearch(query): void
        +handleSelectStore(id): void
    }

    class StorePageView {
        -store: CatStore
        -products: Product[]
        -categories: ProductCategory[]
        -offers: Offer[]
        +render(): JSX
        +filterByCategory(catId): void
        +addToCart(productId, qty): void
    }

    class CartView {
        -cartItems: CartItem[]
        -total: float
        -deliveryFee: float
        +render(): JSX
        +updateQuantity(itemId, qty): void
        +removeItem(itemId): void
        +checkout(): void
    }

    class StoreDashboardView {
        -store: CatStore
        -orders: Order[]
        -analytics: StoreAnalytics
        +render(): JSX
        +updatePage(config): void
        +processOrder(orderId, action): void
    }

    class OrderController {
        -orderService: OrderService
        +getNearbyStores(req, res): Response
        +getStoreDetails(req, res): Response
        +createOrder(req, res): Response
        +confirmOrder(req, res): Response
        +getOrderStatus(req, res): Response
        +updateOrderStatus(req, res): Response
    }

    class OrderService {
        -orderRepo: OrderRepository
        -productRepo: ProductRepository
        -storeRepo: StoreRepository
        -stripeGateway: StripeGateway
        -notificationService: NotificationService
        +findNearbyStores(lat, lng): CatStore[]
        +getStoreDetails(storeId): StoreDetail
        +createOrder(userId, data): OrderPreview
        +confirmOrder(orderId, paymentId): Order
        +updateOrderStatus(orderId, status): Order
        +validateStock(items): boolean
        +calculateTotal(items, deliveryFee): float
    }

    class OrderRepository {
        -db: SupabaseClient
        +create(data): Order
        +findById(id): Order
        +findByUser(userId): Order[]
        +findByStore(storeId): Order[]
        +updateStatus(id, status): Order
    }

    class ProductRepository {
        -db: SupabaseClient
        +findByStore(storeId): Product[]
        +findById(id): Product
        +create(data): Product
        +update(id, data): Product
        +decrementStock(id, qty): void
        +validateStock(items): StockResult[]
    }

    class CatStore {
        +id: UUID
        +owner_user_id: UUID
        +name: string
        +description: string
        +location: Point
        +address: string
        +banner_url: string
        +operating_hours: JSON
        +delivery_zones: JSON
        +delivery_fee: float
        +is_active: boolean
        +rating: float
        +page_config: JSON
    }

    class Product {
        +id: UUID
        +store_id: UUID
        +category_id: UUID
        +name: string
        +description: string
        +price: float
        +discount_price: float
        +images: string[]
        +stock_quantity: int
        +brand: string
        +is_active: boolean
        +rating: float
    }

    class ProductCategory {
        +id: UUID
        +name: string
        +description: string
        +icon_url: string
        +sort_order: int
    }

    class Order {
        +id: UUID
        +user_id: UUID
        +store_id: UUID
        +subtotal: float
        +delivery_fee: float
        +total: float
        +status: OrderStatus
        +payment_id: string
        +delivery_address: string
    }

    class OrderItem {
        +id: UUID
        +order_id: UUID
        +product_id: UUID
        +quantity: int
        +unit_price: float
        +total_price: float
    }

    class Offer {
        +id: UUID
        +store_id: UUID
        +hospital_id: UUID
        +title: string
        +discount_percent: float
        +promo_code: string
        +valid_from: DateTime
        +valid_to: DateTime
        +is_active: boolean
    }

    StoreListView --> OrderController : GET stores
    StorePageView --> OrderController : GET details
    CartView --> OrderController : POST order
    StoreDashboardView --> OrderController : PUT status
    OrderController --> OrderService : business logic
    OrderService --> OrderRepository : order CRUD
    OrderService --> ProductRepository : stock mgmt
    OrderService --> StripeGateway : payments
    OrderService --> NotificationService : alerts
    CatStore "1" --> "*" Product : sells
    CatStore "1" --> "*" Offer : has
    Product --> ProductCategory : belongs to
    Order "1" --> "*" OrderItem : contains
    OrderItem --> Product : references
    Order --> CatStore : from
```

---

## Partial Class Diagram 8: Review System (from TS-10, cross-cutting)

```mermaid
classDiagram
    class ReviewView {
        -reviews: Review[]
        -rating: int
        +render(): JSX
        +submitReview(data): void
        +respondToReview(reviewId, response): void
    }

    class ReviewController {
        -reviewService: ReviewService
        +createReview(req, res): Response
        +getReviews(req, res): Response
        +respondToReview(req, res): Response
        +deleteReview(req, res): Response
    }

    class ReviewService {
        -reviewRepo: ReviewRepository
        +createReview(userId, targetType, targetId, rating, comment): Review
        +getReviewsForTarget(targetType, targetId): Review[]
        +respondToReview(reviewId, responseBy, response): Review
        +calculateAverageRating(targetType, targetId): float
    }

    class ReviewRepository {
        -db: SupabaseClient
        +create(data): Review
        +findByTarget(targetType, targetId): Review[]
        +findById(id): Review
        +update(id, data): Review
        +delete(id): boolean
    }

    class Review {
        +id: UUID
        +user_id: UUID
        +hospital_id: UUID
        +store_id: UUID
        +vet_id: UUID
        +rating: int
        +comment: string
        +status: string
        +created_at: DateTime
    }

    class ReviewResponse {
        +id: UUID
        +review_id: UUID
        +responder_id: UUID
        +response_text: string
        +status: string
        +responded_at: DateTime
    }

    ReviewView --> ReviewController : HTTP
    ReviewController --> ReviewService : business logic
    ReviewService --> ReviewRepository : CRUD
    ReviewRepository ..> Review : manages
    ReviewRepository ..> ReviewResponse : manages
    Review "1" --> "0..1" ReviewResponse : has
```

---

## Partial Class Diagram 9: Hospital Dashboard Customization (from SD-9, TS-8)

```mermaid
classDiagram
    class HospitalDashboardView {
        -hospital: Hospital
        -services: HospitalService[]
        -analytics: HospitalAnalytics
        +render(): JSX
        +updatePage(config): void
        +manageServices(): void
        +manageStaff(): void
        +uploadBanner(file): void
    }

    class HospitalController {
        -hospitalService: HospitalBizService
        +getMyHospital(req, res): Response
        +updatePage(req, res): Response
        +manageServices(req, res): Response
        +manageStaff(req, res): Response
        +getAnalytics(req, res): Response
    }

    class HospitalBizService {
        -hospitalRepo: HospitalRepository
        -storageService: StorageService
        -geoService: GeoLocationService
        +getMyHospital(adminUserId): HospitalDetail
        +updatePage(hospitalId, config): Hospital
        +manageServices(hospitalId, services): HospitalService[]
        +manageStaff(hospitalId, vetIds): Vet[]
        +getAnalytics(hospitalId): HospitalAnalytics
    }

    class HospitalRepository {
        -db: SupabaseClient
        +findByAdmin(adminUserId): Hospital
        +findByRadius(lat, lng, radius): Hospital[]
        +updatePageConfig(id, config): Hospital
        +approve(id): Hospital
    }

    class Hospital {
        +id: UUID
        +admin_user_id: UUID
        +name: string
        +description: string
        +phone: string
        +email: string
        +location: Point
        +address: string
        +banner_url: string
        +operating_hours: JSON
        +is_active: boolean
        +is_approved: boolean
        +rating: float
        +total_reviews: int
        +page_config: JSON
        +created_at: DateTime
    }

    class HospitalService {
        +id: UUID
        +hospital_id: UUID
        +name: string
        +description: string
        +category: string
        +price: float
        +duration_minutes: int
        +is_active: boolean
    }

    HospitalDashboardView --> HospitalController : HTTP
    HospitalController --> HospitalBizService : business logic
    HospitalBizService --> HospitalRepository : hospital CRUD
    HospitalBizService --> StorageService : banner uploads
    HospitalRepository ..> Hospital : manages
    Hospital "1" --> "*" HospitalService : offers
```

---

## Partial Class Diagram 10: Store Dashboard Customization (from SD-11, TS-9)

```mermaid
classDiagram
    class StoreDashboardView {
        -store: CatStore
        -products: Product[]
        -categories: ProductCategory[]
        +render(): JSX
        +updatePage(config): void
        +manageProducts(): void
        +configureDelivery(): void
    }

    class StoreController {
        -storeService: StoreService
        +getMyStore(req, res): Response
        +updateStorePage(req, res): Response
        +createProduct(req, res): Response
        +updateProduct(req, res): Response
        +deleteProduct(req, res): Response
        +manageCategories(req, res): Response
    }

    class StoreService {
        -storeRepo: StoreRepository
        -productRepo: ProductRepository
        -categoryRepo: ProductCategoryRepo
        -storageService: StorageService
        +getMyStore(ownerUserId): StoreDetail
        +updateStorePage(storeId, pageData): CatStore
        +createProduct(storeId, data): Product
        +updateProduct(productId, data): Product
        +deleteProduct(productId): boolean
    }

    class StoreRepository {
        -db: SupabaseClient
        +findByOwner(ownerId): CatStore
        +findByRadius(lat, lng, radius): CatStore[]
        +updatePageConfig(id, config): CatStore
        +approve(id): CatStore
    }

    class ProductCategoryRepo {
        -db: SupabaseClient
        +findAll(): ProductCategory[]
        +create(data): ProductCategory
        +update(id, data): ProductCategory
        +reorder(ids): void
    }

    StoreDashboardView --> StoreController : HTTP
    StoreController --> StoreService : business logic
    StoreService --> StoreRepository : store CRUD
    StoreService --> ProductRepository : product CRUD
    StoreService --> ProductCategoryRepo : category CRUD
    StoreService --> StorageService : image uploads
```

---

## Partial Class Diagram 11: Offer Management (from SD-13, TS-11)

```mermaid
classDiagram
    class OfferManagerView {
        -offers: Offer[]
        +render(): JSX
        +createOffer(data): void
        +toggleOffer(id, active): void
        +deleteOffer(id): void
    }

    class OfferController {
        -offerService: OfferService
        +getOffers(req, res): Response
        +createOffer(req, res): Response
        +updateOffer(req, res): Response
        +deleteOffer(req, res): Response
    }

    class OfferService {
        -offerRepo: OfferRepository
        +getOffersByOwner(ownerId, type): Offer[]
        +createOffer(ownerId, data): Offer
        +updateOffer(offerId, data): Offer
        +deleteOffer(offerId): boolean
        +validateDateRange(from, to): boolean
    }

    class OfferRepository {
        -db: SupabaseClient
        +findByHospital(hospitalId): Offer[]
        +findByStore(storeId): Offer[]
        +create(data): Offer
        +update(id, data): Offer
        +delete(id): boolean
        +findActive(): Offer[]
    }

    class Offer {
        +id: UUID
        +hospital_id: UUID
        +store_id: UUID
        +title: string
        +description: string
        +discount_percent: float
        +promo_code: string
        +valid_from: DateTime
        +valid_to: DateTime
        +is_active: boolean
        +applicable_items: string[]
    }

    OfferManagerView --> OfferController : HTTP
    OfferController --> OfferService : business logic
    OfferService --> OfferRepository : CRUD
    OfferRepository ..> Offer : manages
```

---

## Partial Class Diagram 12: Order Fulfillment (from SD-14, TS-12)

```mermaid
classDiagram
    class StoreOrderView {
        -orders: Order[]
        -activeOrder: Order
        +render(): JSX
        +acceptOrder(orderId): void
        +rejectOrder(orderId, reason): void
        +updateStatus(orderId, status): void
    }

    class OrderController {
        -orderService: OrderService
        +getOrderDetails(req, res): Response
        +updateOrderStatus(req, res): Response
        +getStoreOrders(req, res): Response
    }

    class OrderService {
        -orderRepo: OrderRepository
        -stripeGateway: StripeGateway
        -notificationService: NotificationService
        +getOrderDetails(orderId): OrderDetail
        +updateOrderStatus(orderId, status): Order
        +cancelOrder(orderId, reason): Order
    }

    class Payment {
        +id: UUID
        +order_id: UUID
        +appointment_id: UUID
        +user_id: UUID
        +amount: float
        +payment_method: string
        +stripe_payment_id: string
        +status: string
        +created_at: DateTime
        +completed_at: DateTime
    }

    StoreOrderView --> OrderController : HTTP/Realtime
    OrderController --> OrderService : business logic
    OrderService --> OrderRepository : status updates
    OrderService --> StripeGateway : refunds
    OrderService --> NotificationService : customer alerts
    Order "1" --> "0..1" Payment : paid via
```

---

## Partial Class Diagram 13: Treatment & Prescription (from SD-7, TS-6)

```mermaid
classDiagram
    class Treatment {
        +id: UUID
        +appointment_id: UUID
        +vet_id: UUID
        +cat_id: UUID
        +diagnosis: string
        +notes: string
        +follow_up_instructions: string
        +follow_up_date: Date
        +status: string
        +created_at: DateTime
    }

    class TreatmentRepository {
        -db: SupabaseClient
        +create(data): Treatment
        +findByAppointment(appointmentId): Treatment[]
        +findByCat(catId): Treatment[]
        +findByVet(vetId): Treatment[]
        +update(id, data): Treatment
    }

    Appointment "1" --> "*" Treatment : followed by
    Treatment "1" --> "*" Prescription : leads to
    TreatmentRepository ..> Treatment : manages
```

---

## Partial Class Diagram 14: Admin Operations (from SD-15, TS-13)

```mermaid
classDiagram
    class AdminDashboardView {
        -stats: DashboardStats
        -pendingApprovals: PendingList
        +render(): JSX
        +approveVet(vetId): void
        +approveHospital(hospitalId): void
        +approveStore(storeId): void
        +suspendUser(userId, reason): void
    }

    class AdminController {
        -adminService: AdminService
        +getDashboard(req, res): Response
        +manageUsers(req, res): Response
        +verifyVet(req, res): Response
        +approveHospital(req, res): Response
        +approveStore(req, res): Response
        +suspendUser(req, res): Response
        +manageBreeds(req, res): Response
        +manageAIData(req, res): Response
    }

    class AdminService {
        -userRepo: UserRepository
        -vetRepo: VetRepository
        -hospitalRepo: HospitalRepository
        -storeRepo: StoreRepository
        -notificationService: NotificationService
        +getDashboardStats(): DashboardStats
        +getPendingVets(): Vet[]
        +verifyVet(vetId, action): Vet
        +approveHospital(hospitalId, action): Hospital
        +approveStore(storeId, action): CatStore
        +suspendUser(userId, reason): User
    }

    class VetRepository {
        -db: SupabaseClient
        +findUnverified(): Vet[]
        +verify(vetId): Vet
        +findByHospital(hospitalId): Vet[]
        +update(id, data): Vet
    }

    AdminDashboardView --> AdminController : HTTP
    AdminController --> AdminService : business logic
    AdminService --> UserRepository : user mgmt
    AdminService --> VetRepository : vet verification
    AdminService --> HospitalRepository : hospital approval
    AdminService --> StoreRepository : store approval
    AdminService --> NotificationService : notifications
```

---

## Partial Class Diagram 15: Admin Medicine Management (from SD-10, TS-13)

```mermaid
classDiagram
    class AdminMedicineView {
        -medicines: Medicine[]
        -selectedMedicine: Medicine
        +render(): JSX
        +addMedicine(data): void
        +editMedicine(id, data): void
        +deleteMedicine(id): void
        +searchMedicines(query): void
    }

    class MedicineController {
        -medicineService: MedicineService
        +listMedicines(req, res): Response
        +search(req, res): Response
        +getById(req, res): Response
        +create(req, res): Response
        +update(req, res): Response
        +delete(req, res): Response
    }

    class MedicineService {
        -medicineRepo: MedicineRepository
        -embeddingService: EmbeddingService
        -vectorRepo: VectorRepository
        +listMedicines(page, limit): PaginatedList
        +search(query): Medicine[]
        +getById(id): Medicine
        +create(data): Medicine
        +update(id, data): Medicine
        +delete(id): boolean
    }

    class MedicineRepository {
        -db: SupabaseClient
        +findAll(page, limit): Medicine[]
        +search(query): Medicine[]
        +findById(id): Medicine
        +create(data): Medicine
        +update(id, data): Medicine
        +delete(id): boolean
        +getContraindications(id): ContraindicationInfo
    }

    class EmbeddingService {
        -openaiClient: OpenAI
        +generateEmbedding(text): float[]
        +batchEmbed(texts): float[][]
    }

    class VectorRepository {
        -db: SupabaseClient
        +storeVector(id, vector): void
        +updateVector(id, vector): void
        +similaritySearch(vector, limit): VectorMatch[]
    }

    class Medicine {
        +id: UUID
        +name: string
        +generic_name: string
        +manufacturer: string
        +ingredients: string[]
        +dosage_form: string
        +description: string
        +usage_instructions: string
        +contraindications: string[]
        +allergy_warnings: string[]
        +breed_warnings: string[]
        +side_effects: string[]
        +requires_prescription: boolean
        +is_active: boolean
        +embedding: vector
    }

    AdminMedicineView --> MedicineController : HTTP
    MedicineController --> MedicineService : business logic
    MedicineService --> MedicineRepository : medicine CRUD
    MedicineService --> EmbeddingService : generate vectors
    MedicineService --> VectorRepository : store vectors
    MedicineRepository ..> Medicine : manages
```
