import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Hotel, Room

def populate():
    if Hotel.objects.exists():
        print("Data already exists.")
        return

    h1 = Hotel.objects.create(
        name="Grand Plaza Hotel",
        description="A luxury stay in the city center.",
        address="123 Main St, New York, NY",
        rating=4.5,
        image="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    )
    Room.objects.create(hotel=h1, room_number="101", room_type="SINGLE", price_per_night=100.00, capacity=1)
    Room.objects.create(hotel=h1, room_number="102", room_type="DOUBLE", price_per_night=150.00, capacity=2)
    Room.objects.create(hotel=h1, room_number="201", room_type="SUITE", price_per_night=300.00, capacity=4)

    h2 = Hotel.objects.create(
        name="Seaside Resort",
        description="Relax by the ocean with stunning views.",
        address="456 Beach Rd, Miami, FL",
        rating=4.8,
        image="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    )
    Room.objects.create(hotel=h2, room_number="10A", room_type="DOUBLE", price_per_night=200.00, capacity=2)
    Room.objects.create(hotel=h2, room_number="12B", room_type="SUITE", price_per_night=450.00, capacity=5)

    print("Dummy data created successfully!")

if __name__ == '__main__':
    populate()
