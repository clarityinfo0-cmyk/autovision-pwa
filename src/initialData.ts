import { Service, GalleryItem } from "./types";

export const INITIAL_SERVICES: Service[] = [
  {
    id: "polarizado-3m-crystalline",
    name: "Polarizado Cerámico Premium",
    description: "Película con tecnología de Nano-Partículas Cerámicas. Ofrece un rechazo térmico extremo de hasta un 90% de rayos infrarrojos y un 99% de protección UV sin oscurecer de más tu vista. Garantizado de por vida.",
    category: "Polarizado 3M",
    priceFrom: 1600,
    duration: "3 horas",
    image: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=600",
    active: true
  },
  {
    id: "polarizado-3m-colorstable",
    name: "Polarizado Convencional / Tradicional",
    description: "Película entintada de poliéster de alta calidad. Bloquea la visibilidad desde el exterior ofreciendo una excelente privacidad, un look deportivo y elegante y protección solar básica.",
    category: "Polarizado 3M",
    priceFrom: 500,
    duration: "2.5 horas",
    image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600",
    active: true
  },
  {
    id: "luces-led-premium",
    name: "Focos LED Premium 12,000 LM",
    description: "Reemplazo directo de focos de halógeno por LED de alta potencia. Visibilidad nocturna 300% mayor con haz de luz definido que no encandila.",
    category: "Luces LED",
    priceFrom: 850,
    duration: "1 hora",
    image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600",
    active: true
  },
  {
    id: "luces-led-interiores",
    name: "Iluminación Ambiental LED Neo-Flex",
    description: "Instalación de tiras de luz ambiental ocultas en puertas y tablero con control de color desde App móvil o control físico. Estilo deportivo premium.",
    category: "Luces LED",
    priceFrom: 1200,
    duration: "2 horas",
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600",
    active: true
  },
  {
    id: "barra-led-slim",
    name: "Barra LED Off-Road 52\" Slim",
    description: "Instalación de barra de iluminación LED de alta potencia para vehículos 4x4 o camionetas. Incluye bases reforzadas, cableado blindado y switch iluminado.",
    category: "Barras LED",
    priceFrom: 2200,
    duration: "2.5 horas",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600",
    active: true
  },
  {
    id: "sonido-basico",
    name: "Upgrade de Bocinas Coaxiales",
    description: "Mejora el sonido de agencia. Instalación de juego de bocinas premium de 2 o 3 vías (JBL, Alpine, Pioneer) con bases y adaptadores de conector originales.",
    category: "Sonido automotriz",
    priceFrom: 1500,
    duration: "1.5 horas",
    image: "https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&q=80&w=600",
    active: true
  },
  {
    id: "sonido-subwoofer-plano",
    name: "Subwoofer Plano Amplificado Bajo Asiento",
    description: "Añade graves profundos y potentes sin perder espacio en tu cajuela. Subwoofer de 8\" o 10\" activo colocado de forma oculta debajo del asiento.",
    category: "Sonido automotriz",
    priceFrom: 3800,
    duration: "2 horas",
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=600",
    active: true
  },
  {
    id: "pulido-faros",
    name: "Restauración de Faros con Polímero Líquido",
    description: "Lijado profesional de múltiples pasos para eliminar opacidad y quemaduras de sol, seguido de aplicación de polímero vaporizado de larga duración para un brillo cristalino.",
    category: "Pulido de faros",
    priceFrom: 450,
    duration: "1 hora",
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=600",
    active: true
  },
  {
    id: "pulido-carroceria-espejo",
    name: "Corrección de Pintura de 1 Paso + Sellador",
    description: "Elimina rayones superficiales, marcas de lavado (swirls) y revive el color original. Terminado con cera de carnauba premium o sellador acrílico protector.",
    category: "Pulido de carrocería",
    priceFrom: 1600,
    duration: "4 horas",
    image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=600",
    active: true
  },
  {
    id: "sensores-reversa-camara",
    name: "Kit de Sensores de Reversa y Cámara HD",
    description: "Instalación estética de 4 sensores en la fascia trasera con zumbador acústico e integración de cámara de reversa con visión nocturna conectada a tu pantalla actual.",
    category: "Accesorios",
    priceFrom: 1400,
    duration: "2 horas",
    image: "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&q=80&w=600",
    active: true
  },
  {
    id: "alarma-seguridad-vip",
    name: "Alarma de Seguridad Viper",
    description: "Sistema de seguridad de marca líder con control remoto de gran alcance, sensor de golpes doble zona, corte de encendido para evitar robos y sirena de 6 tonos.",
    category: "Accesorios",
    priceFrom: 2400,
    duration: "3 horas",
    image: "https://images.unsplash.com/photo-1562572159-4ebcd318f4dd?auto=format&fit=crop&q=80&w=600",
    active: true
  },
  {
    id: "paquete-vision-luces-polarizado",
    name: "Paquete Visión Completa (LED + Polarizado)",
    description: "Instalación combinada de Focos LED Premium de alta potencia (12,000 LM) más Polarizado de tu elección para todo tu vehículo. ¡De cortesía especial por Adrián, te regalamos un aromatizante premium de larga duración!",
    category: "Paquetes",
    priceFrom: 2100,
    duration: "3.5 horas",
    image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600",
    active: true
  },
  {
    id: "luces-led-kit-master-pulido",
    name: "Kit Master Luces LED Autovisión",
    description: "Reemplazo integral de focos LED en altas, bajas y faros de niebla con nuestro Kit Master de máxima intensidad. Con la compra de este paquete, te regalamos completamente GRATIS la restauración y pulido profesional de tus faros con polímero vaporizado.",
    category: "Paquetes",
    priceFrom: 1950,
    duration: "2.5 horas",
    image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600",
    active: true
  }
];

export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: "gal-1",
    title: "Restauración de Faros en Jetta Mk6",
    description: "Eliminación completa de película amarilla opaca por el sol y aplicación de sellador de polímero acrílico.",
    category: "Pulido de faros",
    imageUrlBefore: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=400", // Car headlamp look
    imageUrlAfter: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "gal-2",
    title: "Polarizado 3M Color Stable 20% en Honda Civic",
    description: "Instalación impecable en todo el vehículo para máxima privacidad y rechazo de calor.",
    category: "Polarizado 3M",
    imageUrlBefore: "https://images.unsplash.com/photo-1525609004556-c46c7d6cf0a3?auto=format&fit=crop&q=80&w=400",
    imageUrlAfter: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "gal-3",
    title: "Corrección de Pintura en BMW Serie 3",
    description: "Pulido de 2 pasos para remover marcas circulares e imperfecciones y aplicación de cera cerámica.",
    category: "Pulido de carrocería",
    imageUrlBefore: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=400",
    imageUrlAfter: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=400"
  }
];
