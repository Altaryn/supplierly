// Datos de referencia de Chile para las listas desplegables de la ficha .xlsx:
// regiones (16), comunas (346) y un set amplio de ciudades. Se usan para poblar
// la hoja "Listas" y las validaciones de datos del .xlsx (lib/ficha/excel.ts).
// Las comunas/ciudades se ordenan alfabéticamente al construir la ficha.

export const REGIONES_CHILE: string[] = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana de Santiago",
  "Libertador General Bernardo O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén del General Carlos Ibáñez del Campo",
  "Magallanes y de la Antártica Chilena",
];

// 346 comunas, agrupadas por región (norte→sur) para verificar completitud.
export const COMUNAS_CHILE: string[] = [
  // Arica y Parinacota (4)
  "Arica", "Camarones", "General Lagos", "Putre",
  // Tarapacá (7)
  "Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica",
  // Antofagasta (9)
  "Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe",
  "San Pedro de Atacama", "María Elena", "Tocopilla",
  // Atacama (9)
  "Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro",
  "Vallenar", "Alto del Carmen", "Freirina", "Huasco",
  // Coquimbo (15)
  "La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paihuano", "Vicuña",
  "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá",
  "Monte Patria", "Punitaqui", "Río Hurtado",
  // Valparaíso (38)
  "Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero",
  "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada",
  "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota",
  "La Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo",
  "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu",
  "Llaillay", "Panquehue", "Putaendo", "Santa María", "Quilpué", "Limache",
  "Olmué", "Villa Alemana",
  // Metropolitana de Santiago (52)
  "Santiago", "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque",
  "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida",
  "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo",
  "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén",
  "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca",
  "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Puente Alto", "Pirque",
  "San José de Maipo", "Colina", "Lampa", "Tiltil", "San Bernardo", "Buin",
  "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto",
  "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor",
  // Libertador General Bernardo O'Higgins (33)
  "Rancagua", "Codegua", "Coínco", "Coltauco", "Doñihue", "Graneros", "Las Cabras",
  "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua",
  "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "San Fernando", "Chépica",
  "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla",
  "Pumanque", "Santa Cruz", "Pichilemu", "La Estrella", "Litueche", "Marchihue",
  "Navidad", "Paredones",
  // Maule (30)
  "Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue",
  "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue",
  "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia",
  "Teno", "Vichuquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro",
  "San Javier", "Villa Alegre", "Yerbas Buenas",
  // Ñuble (21)
  "Chillán", "Bulnes", "Chillán Viejo", "El Carmen", "Pemuco", "Pinto", "Quillón",
  "San Ignacio", "Yungay", "Quirihue", "Cobquecura", "Coelemu", "Ninhue",
  "Portezuelo", "Ránquil", "Trehuaco", "San Carlos", "Coihueco", "Ñiquén",
  "San Fabián", "San Nicolás",
  // Biobío (33)
  "Concepción", "Coronel", "Chiguayante", "Florida", "Hualpén", "Hualqui", "Lota",
  "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Lebu",
  "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa",
  "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete",
  "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel",
  "Alto Biobío",
  // La Araucanía (32)
  "Temuco", "Carahue", "Cholchol", "Cunco", "Curarrehue", "Freire", "Galvarino",
  "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre Las Casas",
  "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén",
  "Vilcún", "Villarrica", "Angol", "Collipulli", "Curacautín", "Ercilla",
  "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria",
  // Los Ríos (12)
  "Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco",
  "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno",
  // Los Lagos (30)
  "Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Llanquihue",
  "Los Muermos", "Maullín", "Puerto Varas", "Castro", "Ancud", "Chonchi",
  "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi",
  "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro",
  "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena",
  // Aysén (10)
  "Coyhaique", "Lago Verde", "Aysén", "Cisnes", "Guaitecas", "Cochrane",
  "O'Higgins", "Tortel", "Chile Chico", "Río Ibáñez",
  // Magallanes y de la Antártica Chilena (11)
  "Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos",
  "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine",
];

// Ciudades / localidades principales de Chile (norte→sur). Lista amplia y de uso
// común; la validación de "Ciudad" es flexible (permite escribir otra).
export const CIUDADES_CHILE: string[] = [
  "Arica", "Iquique", "Alto Hospicio", "Pozo Almonte", "Antofagasta", "Calama",
  "Tocopilla", "Mejillones", "Taltal", "San Pedro de Atacama", "Copiapó",
  "Vallenar", "Caldera", "Chañaral", "Diego de Almagro", "La Serena", "Coquimbo",
  "Ovalle", "Illapel", "Los Vilos", "Salamanca", "Vicuña", "Andacollo",
  "Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "San Antonio",
  "Quillota", "La Calera", "San Felipe", "Los Andes", "Limache", "Concón",
  "Quintero", "Casablanca", "Santiago", "Puente Alto", "Maipú", "La Florida",
  "San Bernardo", "Las Condes", "Providencia", "Ñuñoa", "La Reina", "Vitacura",
  "Peñalolén", "Quilicura", "Melipilla", "Talagante", "Buin", "Colina", "Lampa",
  "Peñaflor", "Padre Hurtado", "Rancagua", "Machalí", "San Fernando", "Santa Cruz",
  "Rengo", "San Vicente", "Pichilemu", "Talca", "Curicó", "Linares", "Constitución",
  "Molina", "San Javier", "Parral", "Cauquenes", "Chillán", "Chillán Viejo",
  "San Carlos", "Bulnes", "Concepción", "Talcahuano", "Hualpén", "San Pedro de la Paz",
  "Chiguayante", "Coronel", "Lota", "Tomé", "Penco", "Los Ángeles", "Cañete",
  "Lebu", "Curanilahue", "Temuco", "Padre Las Casas", "Villarrica", "Pucón",
  "Angol", "Victoria", "Lautaro", "Nueva Imperial", "Collipulli", "Valdivia",
  "La Unión", "Río Bueno", "Panguipulli", "Lanco", "Puerto Montt", "Puerto Varas",
  "Osorno", "Castro", "Ancud", "Quellón", "Frutillar", "Llanquihue", "Calbuco",
  "Coyhaique", "Puerto Aysén", "Chile Chico", "Cochrane", "Punta Arenas",
  "Puerto Natales", "Porvenir",
];
