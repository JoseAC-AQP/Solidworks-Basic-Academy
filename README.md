# 🛠️ SOLIDWORKS ACADEMY - Preparación Integral para Certificación CSWA

**SOLIDWORKS ACADEMY** es una plataforma educativa estática, ligera y responsive diseñada para la preparación autogestionada de la certificación **Certified SOLIDWORKS Associate (CSWA)** de Dassault Systèmes.

La plataforma funciona 100% en el lado del cliente (Client-Side Only)[cite: 1, 2], lo que permite su despliegue inmediato en **GitHub Pages** sin necesidad de bases de datos ni servidores backend complejos.

---

## 🚀 Características Principales

- **Arquitectura Client-Side & Zero-Backend:** Control de estado, avance del estudiante y cálculo de métricas gestionados dinámicamente mediante `LocalStorage`.
- **Diagnóstico CSWA en Tiempo Real:** Evaluación continua de 9 competencias clave (croquizado, modelado de piezas, modificaciones dimensionales, masa/CG, ensamblajes)[cite: 10].
- **Simuladores Cronometrados:** Cuestionarios y exámenes integrales autocorregibles con temporizador regresivo de 45 minutos.
- **Programa Académico de 16 Semanas:** Organización modular en 8 bloques de aprendizaje con hito curricular integrador final (Proyecto Tornillo de Banco Mecánico)[cite: 2].
- **Diseño Responsivo e Institucional:** Sistema visual modular mediante CSS nativo y diseño adaptable para escritorios y dispositivos móviles[cite: 2].

---

## 📁 Estructura del Proyecto

```text
solidworks-academy/
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD Deployment Workflow para GitHub Pages
├── assets/
│   ├── css/
│   │   ├── style.css             # Hojas de estilo globales y variables institucionales[cite: 2]
│   │   └── components.css        # Componentes UI (tarjetas, botones, visualizador CAD, barras)[cite: 2]
│   ├── js/
│   │   ├── app.js                # Core Engine & Administrador de Estado en LocalStorage[cite: 2, 8]
│   │   ├── cswa.js               # Motor de Diagnóstico por Competencias y Plan de Estudio[cite: 2]
│   │   └── quiz.js               # Motor de Exámenes Autocorregibles y Temporizador[cite: 2]
│   └── data/
│       ├── curriculum.json       # Programa académico completo (16 Semanas / 8 Módulos)[cite: 2]
│       └── cswa_bank.json        # Banco de preguntas y configuraciones del simulador[cite: 2]
├── aula/
│   ├── index.html                # Lista de lecciones del Aula Virtual[cite: 2]
│   └── semana1.html              # Lección de la Semana 1[cite: 2]
├── cswa/
│   ├── index.html                # Centro de Entrenamiento CSWA Practice Center[cite: 2]
│   ├── diagnostico.html          # Panel de Diagnóstico y Plan de Refuerzo Personalizado[cite: 2]
│   └── simulador.html            # Simulador de Examen Cronometrado[cite: 2]
├── .gitignore                    # Archivos ignorados por Git[cite: 2]
├── dashboard.html                # Panel de Control General del Estudiante[cite: 2]
├── index.html                    # Landing Page Principal del Sistema[cite: 1, 2, 4]
├── LICENSE                       # Licencia MIT del software[cite: 2]
└── proyecto.html                 # Evaluación Sumativa Final (Tornillo de Banco Mecánico)[cite: 2]
