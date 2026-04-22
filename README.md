# Barra de Búsquedas Optimizada con Trie

Un proyecto puramente experimental y didáctico para evaluar, visualizar y llevar al límite un algoritmo de búsqueda por recomendación/autocompletado. Este proyecto enfrenta de manera directa una **estructura iterativa tradicional** (Array filtering lineal) contra una estructura jerárquica de **Trie** (Árbol de prefijos).

## ✨ Características Principales

* **Ejecución en Paralelo**: Separación del procesamiento algorítmico al 100% de la UI utilizando Web Workers en segundo plano. Esto previene que se congele el navegador al indexar o buscar volúmenes absurdos de resultados.
* **Métricas en Tiempo Real (Chart.js)**: Dos gráficos dinámicos integrados que levantan los tiempos de latencia generados internamente por `performance.now()`. Miden:
  * Tiempo de búsqueda al tipear vs Longitud de palabra.
  * Tiempo de inserción en masa.
* **Multiplicador de Estrés Constante**: Porque un Trie no brilla en colecciones reducidas; el código internamente multiplica el dataset miles de veces para imitar picos industriales.
* **Inyección de entropía en la UI**: Un generador aleatorio de palabras dinámicas (`kjhxsa`, `vzbklo`) que puedes ingresar en lotes paramétricos a través de la misma página web. ¡Todo el frontend fue construido nativo con Javascript Vainilla!

## 🧠 Arquitectura de motores: Trie vs Lineal

1. **La Búsqueda Tradicional (.filter)** 🐢
   Conserva todo en un Array global. Cada vez que escribes algo, recorre todo la colección de elementos de forma imperativa desde la primera palabra hasta la última preguntando si empieza o contiene el prefijo. De rendimiento asintótico O(N*M).

2. **La Búsqueda con Algoritmo Trie** 🌳
   Una estructura optimizada donde cada nodo representa un carácter. Las ramas equivalentes se combinan. Si buscas `helado`, recorres `h -> e -> l -> a -> d -> o` en el árbol de forma vertiginosamente rápida. De rendimiento asintótico O(M).

## 🗂 Estructura de Carpetas

```bash
/src
 ├── /mocks              # Datasets estáticos en JSON
 ├── /styles             # Grid, flex y CSS vars (Dark Theme)
 ├── /utils              # El core matemático (Trie.js y tradicional.js)
 ├── /workers            # Desacople de motor de búsqueda para el Parallel threading 
 ├── index.html          # Vista en Vainilla HTML5
 └── main.js             # EventLoop, ChartJS, Caching y orquestador
```

## 🎮 Cómo Arrancarlo Localmente

Al utilizar JS Modules (`type="module"`) nativos y Web Workers en segundo plano, tu navegador lanzará un error de `CORS` si intentas abrir el archivo `.html` haciendo doble clic desde el escritorio (por protocolo "file://"). 

Necesitas correr el proyecto sobre un mini-servidor local. Las opciones más sencillas:

### Opción 1: VSCode (Recomendado)
Descarga la extensión de **"Live Server"**, haz click derecho sobre `index.html` y luego en "Open con Live Server".

### Opción 2: Usando Node/NPX
Ubícate en la raíz del proyecto y corre:
```bash
npx http-server
```
Visita la URL (`http://127.0.0.1:8080/src`) en tu navegador.