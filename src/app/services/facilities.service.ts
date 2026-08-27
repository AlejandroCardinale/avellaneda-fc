import { Injectable } from '@angular/core';

export interface Facility {
  id: number;
  name: string;
  description: string;
  image: string;
  icon: string;
  label: string;
  features: string[];
}

@Injectable({ providedIn: 'root' })
export class FacilitiesService {
  private facilities: Facility[] = [
    {
      id: 1, name: 'Cancha de Fútbol', icon: 'fa-futbol', label: 'Deportiva',
      description: 'Cancha de césped natural de dimensiones reglamentarias con iluminación LED para partidos nocturnos.',
      image: 'images/football_pitch.png',
      features: ['Césped natural reglamentario', 'Iluminación LED', 'Tribuna cubierta', 'Vestuarios próximos']
    },
    {
      id: 2, name: 'Piscina Olímpica', icon: 'fa-water', label: 'Acuática',
      description: 'Piscina olímpica de 50 metros con 8 carriles, temperatura regulada y sistema de filtrado de última generación.',
      image: 'images/pool.png',
      features: ['50 metros / 8 carriles', 'Temperatura regulada', 'Tribuna de espectadores', 'Trampolín y plataforma']
    },
    {
      id: 3, name: 'Gimnasio', icon: 'fa-dumbbell', label: 'Fitness',
      description: 'Más de 800m² con equipamiento de última generación. Zona de musculación, cardio y clases grupales.',
      image: 'images/gym.png',
      features: ['800m² de superficie', 'Equipos de última generación', 'Zona cardio y musculación', 'Clases grupales incluidas']
    },
    {
      id: 4, name: 'Canchas de Tenis', icon: 'fa-circle', label: 'Deportiva',
      description: 'Cuatro canchas de tenis con diferentes superficies: polvo de ladrillo y pasto sintético para adaptarse a todos los estilos de juego.',
      image: 'images/tennis.png',
      features: ['4 canchas disponibles', 'Polvo de ladrillo y sintético', 'Iluminación nocturna', 'Alquiler de raquetas']
    }
  ];

  getAll(): Facility[] { return this.facilities; }
  getById(id: number): Facility | undefined { return this.facilities.find(f => f.id === id); }

  getServices() {
    return [
      { icon: 'fa-shower', label: 'Vestuarios y duchas' },
      { icon: 'fa-spa', label: 'Sala de masajes' },
      { icon: 'fa-kit-medical', label: 'Enfermería y primeros auxilios' },
      { icon: 'fa-umbrella-beach', label: 'Quincho para eventos' },
      { icon: 'fa-utensils', label: 'Buffet / Kiosco saludable' },
      { icon: 'fa-square-parking', label: 'Estacionamiento gratuito' }
    ];
  }
}
