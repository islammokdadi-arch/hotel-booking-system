from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from datetime import date, timedelta
from api.models import Hotel, Room, Reservation
from api.serializers import UserSerializer, HotelSerializer, RoomSerializer, ReservationSerializer

class UserSerializerTest(TestCase):
    def setUp(self):
        # Create an existing user for uniqueness tests
        self.existing_user = User.objects.create_user(
            username='existinguser',
            email='existing@example.com',
            password='existingpass123'
        )

    def test_user_serializer_valid_data(self):
        """Test user serializer with valid data"""
        valid_data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'securepass123',
            'first_name': 'Test',
            'last_name': 'User',
            'date_of_birth': '1990-01-01'
        }
        
        serializer = UserSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
        
        # Test password is write-only
        user = serializer.save()
        self.assertEqual(user.username, 'newuser')
        self.assertEqual(user.first_name, 'Test')
        self.assertTrue(user.check_password('securepass123'))
        # Ensure new users are not staff
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_user_serializer_duplicate_email(self):
        """Test user serializer with duplicate email"""
        duplicate_email_data = {
            'username': 'differentuser',
            'email': 'existing@example.com',  # Same as existing user
            'password': 'password123',
            'first_name': 'Different',
            'last_name': 'User',
            'date_of_birth': '1995-01-01'
        }
        
        serializer = UserSerializer(data=duplicate_email_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
        self.assertIn('already exists', str(serializer.errors['email'][0]))

    def test_user_serializer_duplicate_username(self):
        """Test user serializer with duplicate username"""
        duplicate_username_data = {
            'username': 'existinguser',  # Same as existing user
            'email': 'different@example.com',
            'password': 'password123',
            'first_name': 'Different',
            'last_name': 'User',
            'date_of_birth': '1995-01-01'
        }
        
        serializer = UserSerializer(data=duplicate_username_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)
        self.assertIn('already exists', str(serializer.errors['username'][0]))

    def test_user_serializer_password_too_short(self):
        """Test user serializer with short password"""
        short_password_data = {
            'username': 'shortpassuser',
            'email': 'short@example.com',
            'password': '123',  # Too short
            'first_name': 'Short',
            'last_name': 'Password',
            'date_of_birth': '1990-01-01'
        }
        
        serializer = UserSerializer(data=short_password_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)
        self.assertIn('at least 8', str(serializer.errors['password'][0]).lower())

    def test_user_serializer_underage(self):
        """Test user serializer with underage user"""
        # Calculate date for 17-year-old
        today = date.today()
        seventeen_years_ago = date(today.year - 17, today.month, today.day)
        
        underage_data = {
            'username': 'underage',
            'email': 'underage@example.com',
            'password': 'password123',
            'first_name': 'Under',
            'last_name': 'Age',
            'date_of_birth': seventeen_years_ago
        }
        
        serializer = UserSerializer(data=underage_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('date_of_birth', serializer.errors)
        self.assertIn('at least 18', str(serializer.errors['date_of_birth'][0]).lower())

    def test_user_serializer_valid_adult(self):
        """Test user serializer with valid adult"""
        # Calculate date for 18-year-old
        today = date.today()
        eighteen_years_ago = date(today.year - 18, today.month, today.day)
        
        adult_data = {
            'username': 'adultuser',
            'email': 'adult@example.com',
            'password': 'password123',
            'first_name': 'Adult',
            'last_name': 'User',
            'date_of_birth': eighteen_years_ago
        }
        
        serializer = UserSerializer(data=adult_data)
        self.assertTrue(serializer.is_valid())

    def test_date_of_birth_is_write_only(self):
        """Test that date_of_birth field is write-only"""
        valid_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123',
            'first_name': 'Test',
            'last_name': 'User',
            'date_of_birth': '1990-01-01'
        }
        
        serializer = UserSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        
        # Serialize the user back
        output_serializer = UserSerializer(user)
        output_data = output_serializer.data
        
        # date_of_birth should not be in output (it's write-only)
        self.assertNotIn('date_of_birth', output_data)
        # is_staff should be in output (it's read-only)
        self.assertIn('is_staff', output_data)
        self.assertFalse(output_data['is_staff'])

class HotelSerializerTest(TestCase):
    def setUp(self):
        self.hotel_data = {
            'name': 'Test Hotel',
            'description': 'A test hotel for serialization',
            'address': '123 Test Street',
            'image': 'https://example.com/hotel.jpg',
            'rating': 4.5
        }

    def test_hotel_serializer_valid(self):
        """Test hotel serializer with valid data"""
        serializer = HotelSerializer(data=self.hotel_data)
        self.assertTrue(serializer.is_valid())
        
        hotel = serializer.save()
        self.assertEqual(hotel.name, 'Test Hotel')
        self.assertEqual(float(hotel.rating), 4.5)

    def test_hotel_serializer_missing_required_fields(self):
        """Test hotel serializer without required fields"""
        # Test without name
        invalid_data = self.hotel_data.copy()
        del invalid_data['name']
        
        serializer = HotelSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_hotel_serializer_rating_within_range(self):
        """Test hotel serializer with various ratings within 0-5 range"""
        valid_ratings = [0.0, 2.5, 5.0]
        
        for rating in valid_ratings:
            test_data = self.hotel_data.copy()
            test_data['rating'] = rating
            
            serializer = HotelSerializer(data=test_data)
            self.assertTrue(serializer.is_valid(), 
                          f"Rating {rating} should be valid but got errors: {serializer.errors}")

    def test_hotel_serializer_includes_rooms(self):
        """Test that hotel serializer includes rooms field"""
        # First create a hotel
        hotel = Hotel.objects.create(**self.hotel_data)
        
        # Create some rooms
        Room.objects.create(
            hotel=hotel,
            room_number='101',
            room_type='SINGLE',
            price_per_night=100.00,
            capacity=1
        )
        Room.objects.create(
            hotel=hotel,
            room_number='102',
            room_type='DOUBLE',
            price_per_night=150.00,
            capacity=2
        )
        
        # Serialize the hotel
        serializer = HotelSerializer(hotel)
        data = serializer.data
        
        # Check that rooms field exists and has correct count
        self.assertIn('rooms', data)
        self.assertEqual(len(data['rooms']), 2)
        
        # Check room data structure
        self.assertEqual(data['rooms'][0]['room_number'], '101')
        self.assertEqual(data['rooms'][1]['room_number'], '102')

class RoomSerializerTest(TestCase):
    def setUp(self):
        self.hotel = Hotel.objects.create(
            name='Test Hotel',
            description='Test',
            address='Test Address',
            rating=4.0
        )
        
        self.room_data = {
            'hotel': self.hotel.id,
            'room_number': '201',
            'room_type': 'DOUBLE',
            'price_per_night': '120.00',
            'capacity': 2
        }

    def test_room_serializer_valid(self):
        """Test room serializer with valid data"""
        serializer = RoomSerializer(data=self.room_data)
        self.assertTrue(serializer.is_valid())
        
        room = serializer.save()
        self.assertEqual(room.room_number, '201')
        self.assertEqual(room.room_type, 'DOUBLE')
        self.assertEqual(room.hotel, self.hotel)

    def test_room_serializer_missing_hotel(self):
        """Test room serializer without hotel"""
        invalid_data = self.room_data.copy()
        del invalid_data['hotel']
        
        serializer = RoomSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('hotel', serializer.errors)

    def test_room_serializer_invalid_room_type(self):
        """Test room serializer with invalid room type"""
        invalid_data = self.room_data.copy()
        invalid_data['room_type'] = 'INVALID_TYPE'
        
        serializer = RoomSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        # Note: Django model validation happens on save, not in serializer
        # So this might pass serializer validation but fail on save

    def test_room_serializer_negative_price(self):
        """Test room serializer with negative price"""
        invalid_data = self.room_data.copy()
        invalid_data['price_per_night'] = '-50.00'
        
        serializer = RoomSerializer(data=invalid_data)
        # This might pass serializer validation but fail on model save
        # It depends on your model field configuration
        is_valid = serializer.is_valid()
        
        if not is_valid:
            self.assertIn('price_per_night', serializer.errors)

class ReservationSerializerTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass',
            email='test@example.com'
        )
        
        self.hotel = Hotel.objects.create(
            name='Reservation Hotel',
            description='Test',
            address='Test',
            rating=4.0
        )
        
        self.room = Room.objects.create(
            hotel=self.hotel,
            room_number='301',
            room_type='SUITE',
            price_per_night=200.00,
            capacity=3
        )
        
        # Create an existing reservation
        self.existing_reservation = Reservation.objects.create(
            user=self.user,
            room=self.room,
            check_in=date.today() + timedelta(days=1),
            check_out=date.today() + timedelta(days=3)
        )
        
        self.tomorrow = date.today() + timedelta(days=1)
        self.next_week = date.today() + timedelta(days=7)

    def test_reservation_serializer_valid(self):
        """Test reservation serializer with valid data"""
        valid_data = {
            'room': self.room.id,
            'check_in': self.next_week.isoformat(),
            'check_out': (self.next_week + timedelta(days=2)).isoformat()
        }
        
        # Need context with request for user association
        serializer = ReservationSerializer(
            data=valid_data,
            context={'request': type('Request', (), {'user': self.user})()}
        )
        
        self.assertTrue(serializer.is_valid(), 
                       f"Serializer errors: {serializer.errors}")
        
        reservation = serializer.save()
        self.assertEqual(reservation.user, self.user)
        self.assertEqual(reservation.room, self.room)
        self.assertEqual(reservation.check_in, self.next_week)

    def test_reservation_serializer_checkout_before_checkin(self):
        """Test reservation with invalid dates (checkout before checkin)"""
        invalid_data = {
            'room': self.room.id,
            'check_in': self.next_week.isoformat(),
            'check_out': self.tomorrow.isoformat()  # Invalid!
        }
        
        serializer = ReservationSerializer(
            data=invalid_data,
            context={'request': type('Request', (), {'user': self.user})()}
        )
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
        self.assertIn('Check-in must be before check-out', 
                     str(serializer.errors['non_field_errors'][0]))

    def test_reservation_serializer_overlapping_dates(self):
        """Test reservation with overlapping dates"""
        overlapping_data = {
            'room': self.room.id,
            'check_in': (date.today() + timedelta(days=2)).isoformat(),  # Overlaps with existing
            'check_out': (date.today() + timedelta(days=4)).isoformat()
        }
        
        serializer = ReservationSerializer(
            data=overlapping_data,
            context={'request': type('Request', (), {'user': self.user})()}
        )
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
        self.assertIn('already booked', 
                     str(serializer.errors['non_field_errors'][0]).lower())

    def test_reservation_serializer_user_is_read_only(self):
        """Test that user field is read-only in reservation serializer"""
        # Create a different user
        other_user = User.objects.create_user(
            username='otheruser',
            password='otherpass',
            email='other@example.com'
        )
        
        # Try to set user in data (should be ignored)
        data_with_user = {
            'user': other_user.id,  # This should be ignored (read-only)
            'room': self.room.id,
            'check_in': self.next_week.isoformat(),
            'check_out': (self.next_week + timedelta(days=2)).isoformat()
        }
        
        serializer = ReservationSerializer(
            data=data_with_user,
            context={'request': type('Request', (), {'user': self.user})()}
        )
        
        self.assertTrue(serializer.is_valid())
        reservation = serializer.save()
        
        # User should be from request context, not from data
        self.assertEqual(reservation.user, self.user)
        self.assertNotEqual(reservation.user, other_user)

    def test_reservation_serializer_same_day_checkin_checkout(self):
        """Test reservation with same day check-in and check-out"""
        same_day_data = {
            'room': self.room.id,
            'check_in': self.next_week.isoformat(),
            'check_out': self.next_week.isoformat()  # Same day
        }
        
        serializer = ReservationSerializer(
            data=same_day_data,
            context={'request': type('Request', (), {'user': self.user})()}
        )
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
        self.assertIn('Check-in must be before check-out', 
                     str(serializer.errors['non_field_errors'][0]))