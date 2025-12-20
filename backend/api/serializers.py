from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Hotel, Room, Reservation
from datetime import date

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    date_of_birth = serializers.DateField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'date_of_birth', 'is_staff')
        read_only_fields = ('is_staff',)
    
    def validate_email(self, value):
        """Validate that email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_username(self, value):
        """Validate that username is unique"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def validate_password(self, value):
        min_length = 8
        if len(value) < min_length:
            raise serializers.ValidationError(f"Password must be at least {min_length} characters long.")
        return value

    
    def validate_date_of_birth(self, value):
        """Validate that user is at least 18 years old"""
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        
        if age < 18:
            raise serializers.ValidationError("You must be at least 18 years old to register.")
        
        return value
    
    def create(self, validated_data):
        # Remove date_of_birth from validated_data as it's not a User model field
        validated_data.pop('date_of_birth', None)
        
        user = User.objects.create_user(**validated_data)
        # Ensure new users are NOT staff/admin by default
        user.is_staff = False
        user.is_superuser = False
        user.save()
        return user

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

class HotelSerializer(serializers.ModelSerializer):
    rooms = RoomSerializer(many=True, read_only=True)
    class Meta:
        model = Hotel
        fields = '__all__'

class ReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ('user',)

    def validate(self, data):
        check_in = data['check_in']
        check_out = data['check_out']
        room = data['room']

        if check_in >= check_out:
            raise serializers.ValidationError("Check-in must be before check-out")

        # Check for overlaps
        overlaps = Reservation.objects.filter(
            room=room,
            check_in__lt=check_out,
            check_out__gt=check_in
        ).exists()

        if overlaps:
            raise serializers.ValidationError("Room is already booked for these dates.")
        
        return data
