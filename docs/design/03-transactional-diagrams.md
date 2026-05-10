# 03 — Transactional Diagrams (Based on Transaction Pattern)

> **Methodology**: Based on the **Transaction Sets from Transaction Pattern** paper (Usman Waheed & Syed Irfan Hyder), which defines transactions using **players** from Peter Coad's transaction pattern:
>
> **Players**: Actor, Participant, Transaction, TransactionLineItem, Item, SpecificItem, Place, SubsequentTransaction, SubsequentTransactionLineItem
>
> **Player Attributes** (from the paper):
> | Player | Essential Attributes |
> |--------|---------------------|
> | Actor | name, address, phone |
> | Participant | number, start_date, end_date, authorization_level, password |
> | Transaction | number, date, time, status |
> | TransactionLineItem | number, quantity, status |
> | Item | number, name, description, price, default_value |
> | SpecificItem | serial_number, purchase_date, custom_value |
> | Place | number, name, address |
>
> **Transaction Set Types** identified in the paper:
> 1. Simple Participant-Transaction
> 2. Participant-Transaction-Place
> 3. General Item Transaction (with LineItem)
> 4. Specific Item Transaction
> 5. Specific Item Transaction with LineItem
> 6. General and Specific Item Transaction
> 7. Transaction and Subsequent Transaction (without LineItem)
> 8. Transaction with LineItem and Subsequent Transaction without LineItem
> 9. Transaction and Subsequent Transaction both with LineItem

---

## TS-1: User Registration

**Transaction Set Type**: Simple Participant-Transaction

> The simplest form — a Participant (Actor becoming a system user) creating a Transaction (Registration).

**Players**: Actor → Participant (via Registration Transaction)

```mermaid
classDiagram
    note for Actor "Person who wants to use the system"
    note for CatOwnerParticipant "Actor becomes a Participant after registration"
    note for Registration "The registration event itself is the Transaction"
```

**Example mapping**: `Person → CatOwner → Registration`

---

## TS-2: Cat Registration

**Transaction Set Type**: Participant-Transaction-SpecificItem

> A Participant (CatOwner) creates a Transaction (CatRegistration) for a SpecificItem (the individual Cat). Each cat has a unique identity (like a serial number/microchip), making it a SpecificItem rather than a general Item.

**Players**: Participant, Transaction, SpecificItem

```mermaid
classDiagram
    class CatOwner {
        <<Participant>>
        +number: UUID
        +start_date: DateTime
        +authorization_level: string
    }

    class CatRegistration {
        <<Transaction>>
        +number: UUID
        +date: DateTime
        +time: Time
        +status: string
    }

    class Cat {
        <<SpecificItem>>
        +serial_number: string
        +name: string
        +microchip_id: string
        +age_months: int
        +weight_kg: float
        +color: string
        +gender: string
        +photo_url: string
        +is_neutered: boolean
        +registered_at: DateTime
    }

    class CatBreed {
        <<Item>>
        +number: UUID
        +name: string
        +description: string
        +origin_country: string
        +coat_type: string
        +avg_lifespan_years: float
        +common_health_issues: string[]
    }

    class MedicalRecord {
        <<SpecificItem - Extension>>
        +serial_number: UUID
        +allergies: string[]
        +existing_conditions: string[]
        +vaccination_status: JSON
        +blood_type: string
    }

    CatOwner "1" --> "0..*" CatRegistration : initiates
    CatRegistration "1" --> "1" Cat : registers
    Cat "1" --> "1" CatBreed : is of type
    Cat "1" --> "1" MedicalRecord : has

    note for Cat "SpecificItem: each cat has unique identity (microchip_id)"
    note for CatBreed "Item: general breed type, not individually tracked"
```

**Example mapping**: `CatOwner → CatRegistration → Cat (specific) → CatBreed (general item)`

---

## TS-3: Book Appointment

**Transaction Set Type**: Transaction and Subsequent Transaction (without LineItem) + Place

> From the paper: *"Patient – appointment – treatment/admission"*. This is exactly the pattern described — a Participant books a Transaction (Appointment), which leads to a SubsequentTransaction (Treatment/Checkup/Vaccination). Place (Hospital) is involved.

**Players**: Participant, Transaction, SubsequentTransaction, SpecificItem, Place

```mermaid
classDiagram
    class CatOwner {
        <<Participant>>
        +number: UUID
        +start_date: DateTime
        +authorization_level: string
    }

    class Appointment {
        <<Transaction>>
        +number: UUID
        +date: Date
        +time: Time
        +status: string
        +amount_paid: float
        +payment_id: string
    }

    class Treatment {
        <<SubsequentTransaction>>
        +number: UUID
        +date: DateTime
        +time: Time
        +status: string
        +diagnosis: string
        +notes: string
    }

    class Cat {
        <<SpecificItem>>
        +serial_number: string
        +name: string
        +microchip_id: string
    }

    class Hospital {
        <<Place>>
        +number: UUID
        +name: string
        +address: string
        +location: Point
        +operating_hours: JSON
        +rating: float
    }

    class HospitalService {
        <<Item>>
        +number: UUID
        +name: string
        +description: string
        +price: float
        +duration_minutes: int
        +category: string
    }

    class Vet {
        <<Participant>>
        +number: UUID
        +license_number: string
        +specialization: string
        +authorization_level: string = "vet"
    }

    class AppointmentSlot {
        <<Transaction - Extension>>
        +number: UUID
        +date: Date
        +start_time: Time
        +end_time: Time
        +is_booked: boolean
    }

    CatOwner "1" --> "0..*" Appointment : books
    Appointment "0..*" --> "1" Cat : for
    Appointment "0..*" --> "1" Hospital : at
    Appointment "0..*" --> "1" HospitalService : for service
    Appointment "0..*" --> "1" Vet : with
    Appointment "1" --> "1" AppointmentSlot : reserves
    Appointment "1" --> "0..*" Treatment : followed by

    note for Appointment "Transaction: the booking event"
    note for Treatment "SubsequentTransaction: what happens during/after the appointment"
    note for Hospital "Place: where the transaction occurs"
```

**Example mapping (per PDF)**: `CatOwner (Participant) → Appointment (Transaction) → Treatment (SubsequentTransaction) at Hospital (Place)`

---

## TS-4: Purchase Products (Cat Store)

**Transaction Set Type**: Transaction with LineItem and Subsequent Transaction without LineItem

> From the paper: *"Order – order line item – payment"* and *"Customer – order – order line item – product"*. A Participant places an Order (Transaction) with OrderLineItems referencing Items (Products), followed by Payment (SubsequentTransaction). Place (CatStore) is involved.

**Players**: Participant, Transaction, TransactionLineItem, Item, SubsequentTransaction, Place

```mermaid
classDiagram
    class CatOwner {
        <<Participant>>
        +number: UUID
        +start_date: DateTime
        +authorization_level: string
    }

    class Order {
        <<Transaction>>
        +number: UUID
        +date: DateTime
        +time: Time
        +status: string
        +subtotal: float
        +delivery_fee: float
        +total: float
        +delivery_address: string
    }

    class OrderLineItem {
        <<TransactionLineItem>>
        +number: UUID
        +quantity: int
        +status: string
        +unit_price: float
        +total_price: float
    }

    class Product {
        <<Item>>
        +number: UUID
        +name: string
        +description: string
        +price: float
        +default_value: float
        +images: string[]
        +stock_quantity: int
        +brand: string
    }

    class ProductCategory {
        <<Item - Classification>>
        +number: UUID
        +name: string
        +description: string
        +icon_url: string
    }

    class Payment {
        <<SubsequentTransaction>>
        +number: UUID
        +date: DateTime
        +time: Time
        +status: string
        +amount: float
        +payment_method: string
        +stripe_payment_id: string
    }

    class CatStore {
        <<Place>>
        +number: UUID
        +name: string
        +address: string
        +location: Point
        +delivery_zones: JSON
        +delivery_fee: float
        +operating_hours: JSON
        +rating: float
    }

    CatOwner "1" --> "0..*" Order : places
    Order "1" --> "0..*" OrderLineItem : contains
    OrderLineItem "0..*" --> "1" Product : references
    Product "0..*" --> "1" ProductCategory : categorized by
    Order "0..*" --> "1" CatStore : from
    Order "1" --> "0..*" Payment : paid via

    note for Order "Transaction: the purchase event"
    note for OrderLineItem "TransactionLineItem: each product in the order"
    note for Product "Item: general catalog product"
    note for Payment "SubsequentTransaction: payment follows order"
    note for CatStore "Place: where items are purchased from"
```

**Example mapping (per PDF)**: `CatOwner (Participant) → Order (Transaction) → OrderLineItem (TransactionLineItem) → Product (Item) → Payment (SubsequentTransaction) at CatStore (Place)`

---

## TS-5: Vet-User Chat / Direct Contact

**Transaction Set Type**: Simple Participant-Transaction (between two Participants)

> Two Participants (CatOwner and Vet) engage in a Transaction (ChatSession). Each Message is a TransactionLineItem within the session.

**Players**: Participant (x2), Transaction, TransactionLineItem

```mermaid
classDiagram
    class CatOwner {
        <<Participant>>
        +number: UUID
        +authorization_level: string
    }

    class Vet {
        <<Participant>>
        +number: UUID
        +license_number: string
        +authorization_level: string = "vet"
    }

    class ChatSession {
        <<Transaction>>
        +number: UUID
        +date: DateTime
        +time: Time
        +status: string
        +last_message_at: DateTime
    }

    class Message {
        <<TransactionLineItem>>
        +number: UUID
        +quantity: int = 1
        +status: string
        +content: string
        +message_type: string
        +media_url: string
        +is_read: boolean
        +sent_at: DateTime
    }

    CatOwner "1" --> "0..*" ChatSession : participates
    Vet "1" --> "0..*" ChatSession : participates
    ChatSession "1" --> "0..*" Message : contains

    note for ChatSession "Transaction: the chat conversation"
    note for Message "TransactionLineItem: each individual message"
```

**Example mapping**: `CatOwner (Participant) + Vet (Participant) → ChatSession (Transaction) → Message (TransactionLineItem)`

---

## TS-6: Prescribe Medicine

**Transaction Set Type**: Transaction with LineItem and Subsequent Transaction (Appointment → Prescription)

> An Appointment (Transaction) is followed by a Prescription (SubsequentTransaction). The Prescription has PrescriptionLineItems referencing Medicines (Items). This maps to the PDF pattern: *"Transaction with line item and subsequent transaction without line item"* — but here the subsequent transaction (Prescription) also has line items when multiple medicines are prescribed.

**Players**: Participant (Vet), Transaction, SubsequentTransaction, SubsequentTransactionLineItem, Item, SpecificItem

```mermaid
classDiagram
    class Vet {
        <<Participant>>
        +number: UUID
        +license_number: string
        +specialization: string
    }

    class Appointment {
        <<Transaction>>
        +number: UUID
        +date: DateTime
        +time: Time
        +status: string
    }

    class Prescription {
        <<SubsequentTransaction>>
        +number: UUID
        +date: DateTime
        +time: Time
        +status: string
        +dosage: string
        +frequency: string
        +duration_days: int
        +instructions: string
    }

    class Medicine {
        <<Item>>
        +number: UUID
        +name: string
        +description: string
        +price: float
        +ingredients: string[]
        +contraindications: string[]
        +allergy_warnings: string[]
        +breed_warnings: string[]
        +side_effects: string[]
        +requires_prescription: boolean
    }

    class Cat {
        <<SpecificItem>>
        +serial_number: string
        +name: string
        +microchip_id: string
    }

    class MedicalRecord {
        <<SpecificItem - Extension>>
        +allergies: string[]
        +existing_conditions: string[]
    }

    Vet "1" --> "0..*" Appointment : attends
    Appointment "1" --> "0..*" Prescription : results in
    Prescription "0..*" --> "1" Medicine : prescribes
    Prescription "0..*" --> "1" Cat : for
    Cat "1" --> "1" MedicalRecord : has
    MedicalRecord "0..*" ..> "0..*" Medicine : checked against

    note for Appointment "Transaction: the original appointment"
    note for Prescription "SubsequentTransaction: follows the appointment"
    note for Medicine "Item: general medicine from the database"
    note for MedicalRecord "Cross-checked for contraindications before prescribing"
```

**Example mapping (per PDF)**: `Vet (Participant) → Appointment (Transaction) → Prescription (SubsequentTransaction) → Medicine (Item) for Cat (SpecificItem)`

---

## TS-7: AI Companion Consultation

**Transaction Set Type**: Participant-Transaction-Item

> A Participant (CatOwner) creates a Transaction (AIConsultation) about a SpecificItem (Cat). The system queries Items (IllnessRecords) via vector similarity.

**Players**: Participant, Transaction, SpecificItem, Item

```mermaid
classDiagram
    class CatOwner {
        <<Participant>>
        +number: UUID
        +authorization_level: string
    }

    class AIConsultation {
        <<Transaction>>
        +number: UUID
        +date: DateTime
        +time: Time
        +status: string
        +query_text: string
        +confidence_score: float
        +severity: string
    }

    class Cat {
        <<SpecificItem>>
        +serial_number: string
        +name: string
        +microchip_id: string
    }

    class IllnessRecord {
        <<Item>>
        +number: UUID
        +name: string
        +description: string
        +symptoms: string[]
        +affected_breeds: string[]
        +severity_level: string
        +home_remedies: string
        +when_to_see_vet: string
        +related_medicines: string[]
        +embedding: vector
    }

    class AIConsultationResult {
        <<TransactionLineItem>>
        +number: UUID
        +quantity: int = 1
        +status: string
        +matched_illness_id: UUID
        +similarity_score: float
        +rank: int
    }

    CatOwner "1" --> "0..*" AIConsultation : initiates
    AIConsultation "0..*" --> "1" Cat : about
    AIConsultation "1" --> "0..*" AIConsultationResult : produces
    AIConsultationResult "0..*" --> "1" IllnessRecord : matches

    note for AIConsultation "Transaction: the consultation event"
    note for AIConsultationResult "TransactionLineItem: each matched illness result"
    note for IllnessRecord "Item: knowledge base entries with vector embeddings"
```

**Example mapping**: `CatOwner (Participant) → AIConsultation (Transaction) → AIConsultationResult (TransactionLineItem) → IllnessRecord (Item) about Cat (SpecificItem)`

---

## TS-8: Hospital/Store Dashboard Customization

**Transaction Set Type**: Simple Participant-Transaction-Place

> A Participant (HospitalAdmin/StoreOwner) performs a Transaction (PageUpdate) on a Place (Hospital/CatStore).

**Players**: Participant, Transaction, Place

```mermaid
classDiagram
    class HospitalAdmin {
        <<Participant>>
        +number: UUID
        +authorization_level: string = "hospital_admin"
    }

    class PageUpdate {
        <<Transaction>>
        +number: UUID
        +date: DateTime
        +time: Time
        +status: string
        +change_type: string
        +previous_config: JSON
        +new_config: JSON
    }

    class Hospital {
        <<Place>>
        +number: UUID
        +name: string
        +address: string
        +banner_url: string
        +page_config: JSON
        +operating_hours: JSON
    }

    class HospitalService {
        <<Item>>
        +number: UUID
        +name: string
        +description: string
        +price: float
        +duration_minutes: int
        +category: string
    }

    HospitalAdmin "1" --> "0..*" PageUpdate : performs
    PageUpdate "0..*" --> "1" Hospital : updates
    Hospital "1" --> "0..*" HospitalService : offers

    note for PageUpdate "Transaction: the customization event"
    note for Hospital "Place: the entity being customized"
```

> The same pattern applies to **StoreOwner → StorePageUpdate → CatStore**

---

## TS-9: Review & Rating

**Transaction Set Type**: Participant-Transaction-Place (or Participant-Transaction-Participant)

> A Participant (CatOwner) creates a Transaction (Review) about a Place (Hospital/CatStore) or another Participant (Vet).

**Players**: Participant (reviewer), Transaction, Place/Participant (target)

```mermaid
classDiagram
    class CatOwner {
        <<Participant - Reviewer>>
        +number: UUID
        +authorization_level: string
    }

    class Review {
        <<Transaction>>
        +number: UUID
        +date: DateTime
        +time: Time
        +status: string
        +rating: int
        +comment: string
    }

    class ReviewResponse {
        <<SubsequentTransaction>>
        +number: UUID
        +date: DateTime
        +status: string
        +response_text: string
    }

    class Hospital {
        <<Place - Target>>
        +number: UUID
        +name: string
        +address: string
    }

    class CatStore {
        <<Place - Target>>
        +number: UUID
        +name: string
        +address: string
    }

    class Vet {
        <<Participant - Target>>
        +number: UUID
        +name: string
    }

    CatOwner "1" --> "0..*" Review : writes
    Review "0..*" --> "0..1" Hospital : about
    Review "0..*" --> "0..1" CatStore : about
    Review "0..*" --> "0..1" Vet : about
    Review "1" --> "0..1" ReviewResponse : responded with

    note for Review "Transaction: the review event"
    note for ReviewResponse "SubsequentTransaction: business owner responds"
```

---

## TS-10: Offer/Promotion Management

**Transaction Set Type**: Participant-Transaction-Item-Place

> A Participant (HospitalAdmin/StoreOwner) creates a Transaction (Offer) applicable to Items (Services/Products) at a Place (Hospital/Store).

**Players**: Participant, Transaction, Item, Place

```mermaid
classDiagram
    class HospitalAdmin {
        <<Participant>>
        +number: UUID
        +authorization_level: string
    }

    class Offer {
        <<Transaction>>
        +number: UUID
        +date: DateTime
        +time: Time
        +status: string
        +title: string
        +discount_percent: float
        +promo_code: string
        +valid_from: DateTime
        +valid_to: DateTime
    }

    class HospitalService {
        <<Item>>
        +number: UUID
        +name: string
        +description: string
        +price: float
    }

    class Hospital {
        <<Place>>
        +number: UUID
        +name: string
        +address: string
    }

    HospitalAdmin "1" --> "0..*" Offer : creates
    Offer "0..*" --> "0..*" HospitalService : applies to
    Offer "0..*" --> "1" Hospital : at

    note for Offer "Transaction: the promotional offer event"
```

> Same pattern for **StoreOwner → Offer → Product → CatStore**

---

## TS-11: Order Fulfillment (Store Owner processing)

**Transaction Set Type**: Transaction and Subsequent Transaction (without LineItem)

> From the paper: The original Order (Transaction) is followed by OrderFulfillment (SubsequentTransaction) — status changes through preparing → ready → delivered.

**Players**: Participant, Transaction, SubsequentTransaction

```mermaid
classDiagram
    class StoreOwner {
        <<Participant>>
        +number: UUID
        +authorization_level: string = "store_owner"
    }

    class Order {
        <<Transaction>>
        +number: UUID
        +date: DateTime
        +status: string
        +total: float
    }

    class OrderFulfillment {
        <<SubsequentTransaction>>
        +number: UUID
        +date: DateTime
        +time: Time
        +status: string
        +status_change: string
        +notes: string
    }

    StoreOwner "1" --> "0..*" Order : processes
    Order "1" --> "0..*" OrderFulfillment : fulfilled via

    note for Order "Transaction: the original customer order"
    note for OrderFulfillment "SubsequentTransaction: each status change in fulfillment"
```

---

## TS-12: Admin Management Operations

**Transaction Set Type**: Participant-Transaction-SpecificItem/Item

> A Participant (SystemAdmin) performs management Transactions (Approval, Verification, Suspension) on SpecificItems (individual users/vets/hospitals) or Items (medicines, breeds).

**Players**: Participant, Transaction, SpecificItem/Item

```mermaid
classDiagram
    class SystemAdmin {
        <<Participant>>
        +number: UUID
        +authorization_level: string = "admin"
    }

    class AdminAction {
        <<Transaction>>
        +number: UUID
        +date: DateTime
        +time: Time
        +status: string
        +action_type: string
        +reason: string
        +target_type: string
        +target_id: UUID
    }

    class UserAccount {
        <<SpecificItem>>
        +serial_number: UUID
        +name: string
        +email: string
        +role: string
        +is_active: boolean
    }

    class VetProfile {
        <<SpecificItem>>
        +serial_number: UUID
        +license_number: string
        +is_verified: boolean
    }

    class HospitalProfile {
        <<SpecificItem>>
        +serial_number: UUID
        +name: string
        +is_approved: boolean
    }

    class Medicine {
        <<Item>>
        +number: UUID
        +name: string
        +description: string
        +price: float
    }

    class CatBreed {
        <<Item>>
        +number: UUID
        +name: string
        +description: string
    }

    SystemAdmin "1" --> "0..*" AdminAction : performs
    AdminAction "0..*" --> "0..1" UserAccount : on
    AdminAction "0..*" --> "0..1" VetProfile : on
    AdminAction "0..*" --> "0..1" HospitalProfile : on
    AdminAction "0..*" --> "0..1" Medicine : on
    AdminAction "0..*" --> "0..1" CatBreed : on

    note for AdminAction "Transaction: any admin management action"
    note for UserAccount "SpecificItem: individually tracked users"
    note for Medicine "Item: general catalog items"
```

---

## Transaction Set Classification Summary

| TS # | Use Case | Transaction Set Type (per PDF) | Players Used |
|------|----------|-------------------------------|-------------|
| TS-1 | User Registration | Simple Participant-Transaction | Actor → Participant, Transaction |
| TS-2 | Cat Registration | Participant-Transaction-SpecificItem + Item | Participant, Transaction, SpecificItem (Cat), Item (Breed) |
| TS-3 | Book Appointment | Transaction & Subsequent Transaction + Place | Participant (×2), Transaction, SubsequentTransaction, SpecificItem, Place, Item |
| TS-4 | Purchase Products | Transaction with LineItem & Subsequent Transaction + Place | Participant, Transaction, TransactionLineItem, Item, SubsequentTransaction, Place |
| TS-5 | Vet-User Chat | Participant-Transaction with LineItem (two Participants) | Participant (×2), Transaction, TransactionLineItem |
| TS-6 | Prescribe Medicine | Transaction & Subsequent Transaction with LineItem | Participant, Transaction, SubsequentTransaction, Item, SpecificItem |
| TS-7 | AI Consultation | Participant-Transaction-SpecificItem with LineItem | Participant, Transaction, TransactionLineItem, SpecificItem, Item |
| TS-8 | Dashboard Customization | Participant-Transaction-Place | Participant, Transaction, Place |
| TS-9 | Review & Rating | Participant-Transaction + SubsequentTransaction | Participant, Transaction, SubsequentTransaction, Place |
| TS-10 | Offer Management | Participant-Transaction-Item-Place | Participant, Transaction, Item, Place |
| TS-11 | Order Fulfillment | Transaction & Subsequent Transaction | Participant, Transaction, SubsequentTransaction |
| TS-12 | Admin Operations | Participant-Transaction-SpecificItem/Item | Participant, Transaction, SpecificItem, Item |

---

## Behaviors (per PDF Section 4)

Each player in the Purrfect Care system includes these standard behaviors:

| Behavior Category | Behavior | Example in Purrfect Care |
|-------------------|----------|--------------------------|
| **Value Check** | `isActive()` | `Cat.isActive()`, `Hospital.isActive()` |
| | `isAuthorized()` | `Participant.isAuthorized(role)` — check access level |
| | `isStatusValue()` | `Appointment.isStatusValue("confirmed")` |
| | `checkStatus()` | `Order.checkStatus()` — verify current status |
| **Single Record** | `calcForMe()` | `OrderLineItem.calcForMe()` → unit_price × quantity |
| | `rateMe()` | `Hospital.rateMe()` — calculate average rating |
| **Collection** | `howMuch()` | `Order.howMuch()` → SUM of all line item totals |
| | `howMany()` | `CatOwner.howMany()` → COUNT of registered cats |
| | `rankAssociatedPlayer()` | `Hospital.rankAppointments()` — sort by date/status |
| | `calOverAssociatedPlayer()` | `Vet.calOverPrescriptions()` — aggregate stats |
