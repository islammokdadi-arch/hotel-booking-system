from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from datetime import date, timedelta
from api.models import Hotel, Room, Reservation

class HotelModelTest(TestCase):
    def test_create_hotel(self):
        """Test hotel creation with valid data"""
        hotel = Hotel.objects.create(
            name="Grand Plaza",
            description="Luxury hotel in city center",
            address="123 Main St, New York",
            image="https://example.com/hotel.jpg",
            rating=4.5
        )
        self.assertEqual(hotel.name, "Grand Plaza")
        self.assertEqual(str(hotel), "Grand Plaza")
        self.assertIn("Luxury", hotel.description)
        self.assertTrue(0 <= hotel.rating <= 5)

    def test_hotel_without_image(self):
        """Test hotel can be created without image"""
        hotel = Hotel.objects.create(
            name="Budget Inn",
            description="Affordable accommodation",
            address="456 Side St",
            rating=3.0
        )
        self.assertIsNone(hotel.image)
        self.assertEqual(hotel.rating, 3.0)

class RoomModelTest(TestCase):
    def setUp(self):
        self.hotel = Hotel.objects.create(
            name="Test Hotel",
            description="Test",
            address="Test Address",
            rating=4.0
        )

    def test_create_room(self):
        """Test room creation with valid data"""
        room = Room.objects.create(
            hotel=self.hotel,
            room_number="101",
            room_type="DOUBLE",
            price_per_night=150.00,
            capacity=2
        )
        self.assertEqual(room.room_number, "101")
        self.assertEqual(room.room_type, "DOUBLE")
        self.assertEqual(room.capacity, 2)
        self.assertGreater(room.price_per_night, 0)
        self.assertIn("Test Hotel", str(room))

    def test_room_type_choices(self):
        """Test room type validation"""
        valid_types = ['SINGLE', 'DOUBLE', 'SUITE']
        for room_type in valid_types:
            room = Room.objects.create(
                hotel=self.hotel,
                room_number=f"10{valid_types.index(room_type)}",
                room_type=room_type,
                price_per_night=100.00,
                capacity=1
            )
            self.assertEqual(room.get_room_type_display(), room_type.capitalize())

    def test_capacity_validation(self):
        """Test capacity minimum value"""
        room = Room.objects.create(
            hotel=self.hotel,
            room_number="102",
            room_type="SINGLE",
            price_per_night=80.00,
            capacity=0  # Should be allowed by model, but test edge case
        )
        # Test that capacity can be set (though MinValueValidator should prevent <1)
        with self.assertRaises(ValidationError):
            room.full_clean()  # This will trigger validators

class ReservationModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass123",
            email="test@example.com"
        )
        self.hotel = Hotel.objects.create(
            name="Reservation Hotel",
            description="Test",
            address="Test",
            rating=4.0
        )
        self.room = Room.objects.create(
            hotel=self.hotel,
            room_number="201",
            room_type="SUITE",
            price_per_night=250.00,
            capacity=3
        )
        self.tomorrow = date.today() + timedelta(days=1)
        self.next_week = date.today() + timedelta(days=7)

    def test_create_reservation(self):
        """Test reservation creation"""
        reservation = Reservation.objects.create(
            user=self.user,
            room=self.room,
            check_in=self.tomorrow,
            check_out=self.next_week
        )
        self.assertEqual(reservation.user, self.user)
        self.assertEqual(reservation.room, self.room)
        self.assertGreater(reservation.check_out, reservation.check_in)
        self.assertIn(f"Reservation {reservation.id}", str(reservation))
        self.assertIsNotNone(reservation.created_at)

   
    def test_reservation_with_past_date(self):
        """Test reservation with past check-in date"""
        past_date = date.today() - timedelta(days=1)
        reservation = Reservation(
            user=self.user,
            room=self.room,
            check_in=past_date,
            check_out=self.tomorrow
        )
        
        # This might be valid for your business logic
        # Adjust based on your requirements
        try:
            reservation.full_clean()
        except ValidationError as e:
            # If you want to prevent past dates, this will raise error
            self.assertIn('check_in', e.message_dict)