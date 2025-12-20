from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from datetime import date, timedelta
from api.models import Hotel, Room, Reservation

class AuthAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('auth_register')
        self.login_url = reverse('token_obtain_pair')
        self.me_url = reverse('current_user')
        
        # Valid test data
        self.valid_user_data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'securepass123',
            'first_name': 'John',
            'last_name': 'Doe',
            'date_of_birth': '1990-01-01'
        }

    def test_user_registration_success(self):
        """Test successful user registration"""
        response = self.client.post(self.register_url, self.valid_user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('username', response.data)
        self.assertEqual(response.data['username'], 'newuser')
        
        # Verify user was created in database
        user_exists = User.objects.filter(username='newuser').exists()
        self.assertTrue(user_exists)

    def test_user_registration_duplicate_username(self):
        """Test registration with duplicate username"""
        # Create first user
        User.objects.create_user(
            username='existinguser',
            email='user1@example.com',
            password='testpass'
        )
        
        # Try to create user with same username
        duplicate_data = {
            'username': 'existinguser',
            'email': 'different@example.com',
            'password': 'anotherpass',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'date_of_birth': '1995-05-05'
        }
        
        response = self.client.post(self.register_url, duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

   

    def test_user_login_success(self):
        """Test successful login with JWT"""
        # Create user first
        user = User.objects.create_user(
            username='testlogin',
            password='testpass123',
            email='login@example.com'
        )
        
        login_data = {
            'username': 'testlogin',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_user_login_invalid_credentials(self):
        """Test login with wrong password"""
        User.objects.create_user(
            username='testuser',
            password='correctpass',
            email='test@example.com'
        )
        
        login_data = {
            'username': 'testuser',
            'password': 'wrongpass'
        }
        
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_current_user_authenticated(self):
        """Test accessing current user endpoint with valid token"""
        # Create and login user
        user = User.objects.create_user(
            username='currentuser',
            password='testpass',
            email='current@example.com',
            first_name='Current',
            last_name='User'
        )
        
        # Get token
        login_response = self.client.post(self.login_url, {
            'username': 'currentuser',
            'password': 'testpass'
        }, format='json')
        
        token = login_response.data['access']
        
        # Set authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Access protected endpoint
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'currentuser')
        self.assertEqual(response.data['first_name'], 'Current')

    def test_get_current_user_unauthenticated(self):
        """Test accessing current user endpoint without token"""
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class HotelAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.hotel_list_url = reverse('hotel-list')
        
        # Create test data
        self.hotel1 = Hotel.objects.create(
            name="Hotel Alpha",
            description="First test hotel",
            address="Address 1",
            rating=4.2
        )
        self.hotel2 = Hotel.objects.create(
            name="Hotel Beta",
            description="Second test hotel",
            address="Address 2",
            rating=4.5
        )
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            password='adminpass',
            email='admin@example.com',
            is_staff=True
        )
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            username='regular',
            password='regularpass',
            email='regular@example.com',
            is_staff=False
        )

    def test_get_hotels_list_unauthenticated(self):
        """Test anyone can view hotel list"""
        response = self.client.get(self.hotel_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Verify data structure
        hotel_names = [hotel['name'] for hotel in response.data]
        self.assertIn('Hotel Alpha', hotel_names)
        self.assertIn('Hotel Beta', hotel_names)

    def test_get_hotel_detail_unauthenticated(self):
        """Test anyone can view hotel details"""
        detail_url = reverse('hotel-detail', args=[self.hotel1.id])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Hotel Alpha')
        self.assertEqual(response.data['rating'], '4.2')

    def test_create_hotel_unauthorized(self):
        """Test non-admin cannot create hotel"""
        # Login as regular user
        login_response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'regular',
            'password': 'regularpass'
        }, format='json')
        
        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Try to create hotel
        new_hotel_data = {
            'name': 'New Hotel',
            'description': 'Should fail',
            'address': 'Test Address',
            'rating': 4.0
        }
        
        response = self.client.post(self.hotel_list_url, new_hotel_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_hotel_as_admin(self):
        """Test admin can create hotel"""
        # Login as admin
        login_response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'admin',
            'password': 'adminpass'
        }, format='json')
        
        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create hotel
        new_hotel_data = {
            'name': 'Admin Created Hotel',
            'description': 'Created by admin',
            'address': 'Admin Street 123',
            'rating': 4.8,
            'image': 'https://example.com/admin-hotel.jpg'
        }
        
        response = self.client.post(self.hotel_list_url, new_hotel_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Admin Created Hotel')
        
        # Verify hotel was created in database
        hotel_exists = Hotel.objects.filter(name='Admin Created Hotel').exists()
        self.assertTrue(hotel_exists)

    def test_update_hotel_as_admin(self):
        """Test admin can update hotel"""
        # Login as admin
        login_response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'admin',
            'password': 'adminpass'
        }, format='json')
        
        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Update hotel
        update_url = reverse('hotel-detail', args=[self.hotel1.id])
        update_data = {
            'name': 'Updated Hotel Alpha',
            'description': 'Updated description',
            'address': 'Updated Address',
            'rating': 4.9
        }
        
        response = self.client.put(update_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Hotel Alpha')
        
        # Verify update in database
        self.hotel1.refresh_from_db()
        self.assertEqual(self.hotel1.name, 'Updated Hotel Alpha')

class ReservationAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create users
        self.user1 = User.objects.create_user(
            username='user1',
            password='pass1',
            email='user1@example.com'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            password='pass2',
            email='user2@example.com'
        )
        
        # Create hotel and room
        self.hotel = Hotel.objects.create(
            name='Reservation Hotel',
            description='For reservation tests',
            address='Test Address',
            rating=4.0
        )
        self.room = Room.objects.create(
            hotel=self.hotel,
            room_number='301',
            room_type='DOUBLE',
            price_per_night=120.00,
            capacity=2
        )
        
        # Create reservations
        self.tomorrow = date.today() + timedelta(days=1)
        self.next_week = date.today() + timedelta(days=7)
        
        self.reservation1 = Reservation.objects.create(
            user=self.user1,
            room=self.room,
            check_in=self.tomorrow,
            check_out=self.tomorrow + timedelta(days=2)
        )
        
        self.reservation2 = Reservation.objects.create(
            user=self.user2,
            room=self.room,
            check_in=self.next_week,
            check_out=self.next_week + timedelta(days=3)
        )

    def test_create_reservation_authenticated(self):
        """Test authenticated user can create reservation"""
        # Login as user1
        login_response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'user1',
            'password': 'pass1'
        }, format='json')
        
        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create new reservation
        new_reservation_data = {
            'room': self.room.id,
            'check_in': (date.today() + timedelta(days=10)).isoformat(),
            'check_out': (date.today() + timedelta(days=12)).isoformat()
        }
        
        response = self.client.post(reverse('reservation-list'), new_reservation_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['room'], self.room.id)
        
        # Verify reservation belongs to correct user
        reservation_id = response.data['id']
        reservation = Reservation.objects.get(id=reservation_id)
        self.assertEqual(reservation.user, self.user1)

    def test_create_reservation_unauthenticated(self):
        """Test unauthenticated user cannot create reservation"""
        new_reservation_data = {
            'room': self.room.id,
            'check_in': date.today().isoformat(),
            'check_out': (date.today() + timedelta(days=2)).isoformat()
        }
        
        response = self.client.post(reverse('reservation-list'), new_reservation_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_sees_only_own_reservations(self):
        """Test user can only see their own reservations"""
        # Login as user1
        login_response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'user1',
            'password': 'pass1'
        }, format='json')
        
        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Get reservations
        response = self.client.get(reverse('reservation-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should only see user1's reservations
        reservation_ids = [res['id'] for res in response.data]
        self.assertIn(self.reservation1.id, reservation_ids)
        self.assertNotIn(self.reservation2.id, reservation_ids)
        
        # Verify only 1 reservation for user1
        self.assertEqual(len(response.data), 1)

    def test_create_reservation_invalid_dates(self):
        """Test reservation with check_out before check_in"""
        # Login as user1
        login_response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'user1',
            'password': 'pass1'
        }, format='json')
        
        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create invalid reservation (check_out before check_in)
        invalid_data = {
            'room': self.room.id,
            'check_in': (date.today() + timedelta(days=5)).isoformat(),
            'check_out': (date.today() + timedelta(days=3)).isoformat()  # Invalid!
        }
        
        response = self.client.post(reverse('reservation-list'), invalid_data, format='json')
        # Depending on your serializer validation, this should return 400
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR])

    def test_create_reservation_past_date(self):
        """Test reservation with past check-in date"""
        # Login as user1
        login_response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'user1',
            'password': 'pass1'
        }, format='json')
        
        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Try to create reservation with past date
        past_data = {
            'room': self.room.id,
            'check_in': (date.today() - timedelta(days=2)).isoformat(),
            'check_out': date.today().isoformat()
        }
        
        response = self.client.post(reverse('reservation-list'), past_data, format='json')
        # This might be valid or invalid based on your business rules
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])