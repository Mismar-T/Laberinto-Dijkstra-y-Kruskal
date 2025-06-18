// Configuración del laberinto
const TAMANO_LABERINTO = 15;
let laberinto = [];
let posicionJugador = [1, 1];
let posicionMeta = [TAMANO_LABERINTO - 2, TAMANO_LABERINTO - 2];
let caminoRecorrido = [];
const contenedorLaberinto = document.getElementById("laberinto");

// Generar laberinto usando algoritmo de Kruskal
function generarLaberinto() {
    posicionJugador = [1, 1];
    posicionMeta = [TAMANO_LABERINTO - 2, TAMANO_LABERINTO - 2];
    caminoRecorrido = [];
    
    // Inicializar laberinto con paredes
    laberinto = Array.from({ length: TAMANO_LABERINTO }, (_, fila) => 
        Array.from({ length: TAMANO_LABERINTO }, (_, columna) => 
            (columna % 2 === 1 && fila % 2 === 1 ? 0 : 1)
        )
    );

    // Clase para manejar conjuntos disjuntos
    class ConjuntoDisjunto {
        constructor(tamano) {
            this.padre = new Array(tamano).fill(0).map((_, i) => i);
        }
        
        encontrar(x) {
            if (this.padre[x] !== x) {
                this.padre[x] = this.encontrar(this.padre[x]);
            }
            return this.padre[x];
        }
        
        unir(x, y) {
            const raizX = this.encontrar(x);
            const raizY = this.encontrar(y);
            if (raizX !== raizY) {
                this.padre[raizY] = raizX;
            }
        }
    }

    // Crear aristas entre celdas
    const obtenerIndice = (x, y) => (y >> 1) * ((TAMANO_LABERINTO - 1) >> 1) + (x >> 1);
    const aristas = [];

    for (let fila = 1; fila < TAMANO_LABERINTO; fila += 2) {
        for (let columna = 1; columna < TAMANO_LABERINTO; columna += 2) {
            if (columna + 2 < TAMANO_LABERINTO) {
                aristas.push([[columna, fila], [columna + 2, fila]]);
            }
            if (fila + 2 < TAMANO_LABERINTO) {
                aristas.push([[columna, fila], [columna, fila + 2]]);
            }
        }
    }

    // Mezclar aristas aleatoriamente
    for (let i = aristas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [aristas[i], aristas[j]] = [aristas[j], aristas[i]];
    }

    // Aplicar algoritmo de Kruskal
    const conjuntos = new ConjuntoDisjunto(((TAMANO_LABERINTO - 1) >> 1) * ((TAMANO_LABERINTO - 1) >> 1));

    for (const [[x1, y1], [x2, y2]] of aristas) {
        const indice1 = obtenerIndice(x1, y1);
        const indice2 = obtenerIndice(x2, y2);
        if (conjuntos.encontrar(indice1) !== conjuntos.encontrar(indice2)) {
            conjuntos.unir(indice1, indice2);
            laberinto[(y1 + y2) >> 1][(x1 + x2) >> 1] = 0;
        }
    }

    dibujarLaberinto();
}

// Dibujar el laberinto en pantalla
function dibujarLaberinto() {
    contenedorLaberinto.innerHTML = "";
    contenedorLaberinto.style.gridTemplateColumns = `repeat(${TAMANO_LABERINTO}, 30px)`;
    
    for (let fila = 0; fila < TAMANO_LABERINTO; fila++) {
        for (let columna = 0; columna < TAMANO_LABERINTO; columna++) {
            const celda = document.createElement("div");
            let claseCelda = "celda ";
            
            if (fila === posicionJugador[0] && columna === posicionJugador[1]) {
                claseCelda += "jugador";
            } else if (fila === posicionMeta[0] && columna === posicionMeta[1]) {
                claseCelda += "fin";
            } else if (laberinto[fila][columna] === 1) {
                claseCelda += "pared";
            } else {
                claseCelda += "camino";
            }
            
            celda.className = claseCelda;
            celda.id = `celda-${fila}-${columna}`;
            contenedorLaberinto.appendChild(celda);
        }
    }
    
    // Marcar camino recorrido
    caminoRecorrido.forEach(([fila, columna]) => {
        const celda = document.getElementById(`celda-${fila}-${columna}`);
        if (celda) celda.classList.add("jugado");
    });
}

// Mover jugador
function moverJugador(direccion) {
    const [filaActual, columnaActual] = posicionJugador;
    let nuevaFila = filaActual;
    let nuevaColumna = columnaActual;
    
    switch (direccion) {
        case 'arriba': nuevaFila--; break;
        case 'abajo': nuevaFila++; break;
        case 'izquierda': nuevaColumna--; break;
        case 'derecha': nuevaColumna++; break;
    }
    
    intentarMover(nuevaFila, nuevaColumna);
}

// Intentar mover a nueva posición
function intentarMover(nuevaFila, nuevaColumna) {
    const esPosicionValida = nuevaFila >= 0 && nuevaColumna >= 0 && 
                             nuevaFila < TAMANO_LABERINTO && nuevaColumna < TAMANO_LABERINTO && 
                             laberinto[nuevaFila][nuevaColumna] === 0;
    
    if (esPosicionValida) {
        caminoRecorrido.push([...posicionJugador]);
        posicionJugador = [nuevaFila, nuevaColumna];
        dibujarLaberinto();
        
        if (nuevaFila === posicionMeta[0] && nuevaColumna === posicionMeta[1]) {
            mostrarCaminoOptimo();
            setTimeout(() => alert("¡Ganaste!"), 100);
        }
    }
}

// Mostrar camino óptimo usando Dijkstra
function mostrarCaminoOptimo() {
    const distancias = Array.from({ length: TAMANO_LABERINTO }, () => Array(TAMANO_LABERINTO).fill(Infinity));
    const predecesores = Array.from({ length: TAMANO_LABERINTO }, () => Array(TAMANO_LABERINTO).fill(null));
    distancias[1][1] = 0;
    const nodosVisitados = new Set();

    // Algoritmo de Dijkstra
    while (true) {
        let distanciaMinima = Infinity;
        let nodoActual = null;
        
        // Encontrar nodo no visitado con menor distancia
        for (let fila = 0; fila < TAMANO_LABERINTO; fila++) {
            for (let columna = 0; columna < TAMANO_LABERINTO; columna++) {
                const clave = `${fila},${columna}`;
                if (!nodosVisitados.has(clave) && distancias[fila][columna] < distanciaMinima) {
                    distanciaMinima = distancias[fila][columna];
                    nodoActual = [fila, columna];
                }
            }
        }
        
        if (!nodoActual || (nodoActual[0] === posicionMeta[0] && nodoActual[1] === posicionMeta[1])) {
            break;
        }
        
        nodosVisitados.add(`${nodoActual[0]},${nodoActual[1]}`);
        
        // Explorar vecinos
        const direcciones = [[0, 1], [1, 0], [-1, 0], [0, -1]];
        for (const [df, dc] of direcciones) {
            const filaVecina = nodoActual[0] + df;
            const columnaVecina = nodoActual[1] + dc;
            
            if (filaVecina >= 0 && columnaVecina >= 0 && 
                filaVecina < TAMANO_LABERINTO && columnaVecina < TAMANO_LABERINTO && 
                laberinto[filaVecina][columnaVecina] === 0) {
                
                const nuevaDistancia = distancias[nodoActual[0]][nodoActual[1]] + 1;
                if (nuevaDistancia < distancias[filaVecina][columnaVecina]) {
                    distancias[filaVecina][columnaVecina] = nuevaDistancia;
                    predecesores[filaVecina][columnaVecina] = [nodoActual[0], nodoActual[1]];
                }
            }
        }
    }

    // Reconstruir y mostrar camino óptimo
    let [filaActual, columnaActual] = posicionMeta;
    while (predecesores[filaActual][columnaActual]) {
        const [filaPrevia, columnaPrevia] = predecesores[filaActual][columnaActual];
        const celda = document.getElementById(`celda-${filaPrevia}-${columnaPrevia}`);
        if (celda && (filaPrevia !== 1 || columnaPrevia !== 1)) {
            celda.classList.add("optimo");
        }
        [filaActual, columnaActual] = [filaPrevia, columnaPrevia];
    }
}

// Event listeners
document.addEventListener("keydown", (e) => {
    const teclas = {
        "ArrowUp": "arriba",
        "ArrowDown": "abajo", 
        "ArrowLeft": "izquierda",
        "ArrowRight": "derecha"
    };
    if (teclas[e.key]) {
        moverJugador(teclas[e.key]);
    }
});

// Soporte para gestos táctiles
let posicionInicialX = 0;
let posicionInicialY = 0;

document.addEventListener('touchstart', (e) => {
    posicionInicialX = e.touches[0].clientX;
    posicionInicialY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    if (!posicionInicialX || !posicionInicialY) return;
    
    const posicionFinalX = e.changedTouches[0].clientX;
    const posicionFinalY = e.changedTouches[0].clientY;
    
    const diferenciaX = posicionInicialX - posicionFinalX;
    const diferenciaY = posicionInicialY - posicionFinalY;
    const distanciaMinima = 50;
    
    if (Math.abs(diferenciaX) > Math.abs(diferenciaY)) {
        if (Math.abs(diferenciaX) > distanciaMinima) {
            moverJugador(diferenciaX > 0 ? "izquierda" : "derecha");
        }
    } else {
        if (Math.abs(diferenciaY) > distanciaMinima) {
            moverJugador(diferenciaY > 0 ? "arriba" : "abajo");
        }
    }
    
    posicionInicialX = posicionInicialY = 0;
});

// Iniciar juego
generarLaberinto();