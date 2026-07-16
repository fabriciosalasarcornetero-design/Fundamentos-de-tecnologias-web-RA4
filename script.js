const productos = [
    {
        id: 1,
        nombre: 'iPhone 15 Pro',
        precio: 2000,
        categoria: 'Celulares',
        descuento: 15,
        imagen: 'https://celoff.com/wp-content/uploads/2026/01/71.png'
    },
    {
        id: 2,
        nombre: 'MacBook Air M2',
        precio: 4999,
        categoria: 'Laptops',
        imagen: 'https://mac-center.com.pe/cdn/shop/files/IMG-16751954_18cebee9-5684-44c8-b8ab-76b77dabe532.jpg?v=1741187934&width=823'
    },
    {
        id: 3,
        nombre: 'AirPods Pro 3 - Blanco',
        precio: 500,
        categoria: 'Audio',
        descuento: 20,
        imagen: 'https://coolboxpe.vtexassets.com/arquivos/ids/515546/MTJV3AM-A_1.jpg?v=639180806491470000'
    },
    {
        id: 4,
        nombre: 'Galaxy Watch 6',
        precio: 550,
        categoria: 'Smartwatch',
        imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2xlXsv0dnPhMvUGo3fZKxawgc9yJsDRyzEA&s'
    },
    {
        id: 5,
        nombre: 'PlayStation 5',
        precio: 2199,
        categoria: 'Gaming',
        descuento: 10,
        imagen: 'https://rimage.ripley.com.pe/home.ripley/Attachment/MKP/4412/PMP20000216462/full_image-1.jpeg'
    },
    {
        id: 6,
        nombre: 'Laptop ASUS Zenbook',
        precio: 3199,
        categoria: 'Laptops',
        imagen: 'https://dlcdnwebimgs.asus.com/gain/d8fba7d6-5fe3-4e21-8509-463018dd8e81/w717/h717'
    },
    {
        id: 7,
        nombre: 'Cámara Canon EOS R6',
        precio: 4999,
        categoria: 'Cámaras',
        imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrl7_MeIyoHfkeyEWHHXLfqPm3gXzJL3yEGw&s'
    },
    {
        id: 8,
        nombre: 'Tablet Samsung Galaxy Tab S8',
        precio: 1999,
        categoria: 'Tablets',
        imagen: 'https://www.laptopperu.pe/wp-content/uploads/2023/03/tablet-samsung-galaxy-tab-s8-pantalla-11-pulgadas-8gb-ram-3.webp'
    },
    {
        id: 9,
        nombre: 'Auriculares Sony WH-1000XM4',
        precio: 150,
        categoria: 'Audio',
        descuento: 25,
        imagen: 'https://media.falabella.com/falabellaPE/126067571_01/w=800,h=800,fit=pad'
    },
    {
        id: 10,
        nombre: 'AirPods Max 2 - Blanco Estelar',
        precio: 1999,
        categoria: 'Audio',
        imagen: 'https://http2.mlstatic.com/D_NQ_NP_2X_905932-MLA108178039588_032026-F.webp'
    },
    {
        id: 11,
        nombre: 'iPad Pro 12.9"',
        precio: 2199,
        categoria: 'Tablets',
        imagen: 'https://pe.nixblix.com/cdn/shop/files/iPad_Pro_Wi-Fi_12-9_in_6th_generation_Space_Gray_PDP_Image_Position-1b__MXLA.webp?v=1771338215&width=1024'
    },
    {
        id: 12,
        nombre: 'Nintendo Switch OLED',
        precio: 1499,
        categoria: 'Gaming',
        descuento: 15,
        imagen: 'https://promart.vteximg.com.br/arquivos/ids/2229655-1000-1000/image-946d2f0f16c24ca48f9961bbb9f59f93.jpg?v=637687030628100000'
    }
];

let carrito = [];
let descuentoAplicado = false;
let filtroCategoria = 'Todas';
let mostrarSoloOfertas = false;
let terminoBusqueda = '';
let ordenActual = 'relevancia';
let tasaCambioUSD = null; // Tipo de cambio PEN -> USD, obtenido de una API REST externa

function formatearPrecio(valor) {
    return `S/ ${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function obtenerPrecioFinal(producto) {
    if (!producto.descuento) return producto.precio;
    return producto.precio * (1 - producto.descuento / 100);
}

/**
 * Integración con servicio externo (API REST): obtiene el tipo de cambio
 * Sol peruano (PEN) -> Dólar estadounidense (USD) para mostrar un precio
 * referencial junto al precio en soles del catálogo y del carrito.
 * Usa fetch + async/await, valida el estado HTTP de la respuesta,
 * parsea el JSON devuelto y maneja errores de red o de datos (try/catch),
 * sin bloquear el resto de la aplicación si el servicio no responde.
 */
async function cargarTipoCambio() {
    const indicador = document.getElementById('tipoCambioInfo');

    try {
        const respuesta = await fetch('https://open.er-api.com/v6/latest/PEN');

        if (!respuesta.ok) {
            throw new Error(`El servicio de tipo de cambio respondió con estado HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        if (datos.result !== 'success' || !datos.rates || typeof datos.rates.USD !== 'number') {
            throw new Error('La respuesta de la API no contiene un tipo de cambio válido.');
        }

        tasaCambioUSD = datos.rates.USD;

        if (indicador) {
            indicador.textContent = `Tipo de cambio referencial: S/ 1.00 ≈ US$ ${tasaCambioUSD.toFixed(3)} (fuente: exchangerate-api.com)`;
        }

        // Refresca las vistas que muestran precios para incluir el equivalente en USD
        renderProductos();
        renderCarrito();
    } catch (error) {
        console.error('No se pudo obtener el tipo de cambio:', error);
        tasaCambioUSD = null;

        if (indicador) {
            indicador.textContent = 'No se pudo cargar el tipo de cambio en este momento.';
        }
    }
}

function debounce(funcion, espera = 300) {
    let temporizador;
    return (...args) => {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => funcion(...args), espera);
    };
}

function mostrarMensaje(texto, tipo = 'exito') {
    const mensaje = document.getElementById('mensaje');
    if (!mensaje) return;

    mensaje.textContent = texto;
    mensaje.style.background = tipo === 'error' ? '#dc2626' : '#16a34a';
    mensaje.style.display = 'block';

    clearTimeout(mostrarMensaje.timeoutId);
    mostrarMensaje.timeoutId = setTimeout(() => {
        mensaje.style.display = 'none';
    }, 2200);
}

function abrirModal() {
    const modal = document.getElementById('modalCarrito');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function cerrarModal() {
    const modal = document.getElementById('modalCarrito');
    if (modal) {
        modal.style.display = 'none';
    }
}

function getProductosFiltrados() {
    const termino = terminoBusqueda.trim().toLowerCase();
    const lista = productos.filter(producto => {
        const coincideCategoria = filtroCategoria === 'Todas' || producto.categoria === filtroCategoria;
        const coincideOferta = !mostrarSoloOfertas || Boolean(producto.descuento);
        const coincideBusqueda = producto.nombre.toLowerCase().includes(termino) ||
            producto.categoria.toLowerCase().includes(termino);
        return coincideCategoria && coincideOferta && coincideBusqueda;
    });

    return ordenarProductos(lista);
}

function ordenarProductos(lista) {
    const listaOrdenada = [...lista];

    switch (ordenActual) {
        case 'precio-asc':
            return listaOrdenada.sort((a, b) => obtenerPrecioFinal(a) - obtenerPrecioFinal(b));
        case 'precio-desc':
            return listaOrdenada.sort((a, b) => obtenerPrecioFinal(b) - obtenerPrecioFinal(a));
        case 'nombre-asc':
            return listaOrdenada.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        case 'nombre-desc':
            return listaOrdenada.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'));
        default:
            return listaOrdenada;
    }
}

function renderSkeletons(cantidad = 6) {
    const contenedor = document.getElementById('productos');
    if (!contenedor) return;

    contenedor.innerHTML = Array.from({ length: cantidad }).map(() => `
    <div class="producto-skeleton" aria-hidden="true">
      <div class="skeleton-linea skeleton-badge"></div>
      <div class="skeleton-linea skeleton-imagen"></div>
      <div class="skeleton-linea skeleton-titulo"></div>
      <div class="skeleton-linea skeleton-meta"></div>
    </div>
  `).join('');
}

function renderFiltros() {
    const contenedor = document.getElementById('filtrosCategorias');
    if (!contenedor) return;

    const categorias = ['Todas', ...new Set(productos.map(producto => producto.categoria))];
    const botonesCategoria = categorias.map(categoria => `
    <button class="${categoria === filtroCategoria && !mostrarSoloOfertas ? 'active' : ''}" data-categoria="${categoria}">${categoria}</button>
  `).join('');

    const botonOfertas = `<button class="${mostrarSoloOfertas ? 'active' : ''}" data-categoria="Ofertas">🔥 Ofertas</button>`;

    contenedor.innerHTML = botonOfertas + botonesCategoria;
}

function renderProductos() {
    const contenedor = document.getElementById('productos');
    if (!contenedor) return;

    const lista = getProductosFiltrados();

    if (!lista.length) {
        contenedor.innerHTML = '<p>No encontramos productos con ese nombre.</p>';
        actualizarResultado();
        return;
    }

    contenedor.innerHTML = lista.map(producto => {
        const tieneDescuento = Boolean(producto.descuento);
        const precioFinal = obtenerPrecioFinal(producto);

        return `
    <article class="producto">
      ${tieneDescuento ? `<span class="producto-descuento-badge">-${producto.descuento}%</span>` : ''}
      <span class="producto-badge">${producto.categoria}</span>
      <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy" decoding="async">
      <h3>${producto.nombre}</h3>
      <div class="producto-meta">
        <span>Envío gratis</span>
        <span>
          ${tieneDescuento ? `<span class="producto-precio-original">${formatearPrecio(producto.precio)}</span>` : ''}
          <strong class="${tieneDescuento ? 'producto-precio-final' : ''}">${formatearPrecio(precioFinal)}</strong>
          ${tasaCambioUSD ? `<span class="producto-precio-usd">≈ US$ ${(precioFinal * tasaCambioUSD).toFixed(2)}</span>` : ''}
        </span>
      </div>
      <button data-id="${producto.id}">Agregar al carrito</button>
    </article>
  `;
    }).join('');

    actualizarResultado();
}

function actualizarResultado() {
    const resultado = document.getElementById('resultadoCantidad');
    if (!resultado) return;

    const cantidad = getProductosFiltrados().length;
    resultado.textContent = `${cantidad} producto${cantidad === 1 ? '' : 's'} disponible${cantidad === 1 ? '' : 's'}`;
}

function actualizarContador() {
    const contador = document.getElementById('contador');
    if (contador) {
        contador.textContent = carrito.reduce((total, item) => total + item.cantidad, 0);
    }
}

function renderCarrito() {
    const lista = document.getElementById('lista');
    const total = document.getElementById('total');
    const descuentoTexto = document.getElementById('descuento');
    const totalUsd = document.getElementById('totalUsd');

    if (!lista || !total) return;

    if (!carrito.length) {
        lista.innerHTML = '<li class="carrito-vacio">Tu carrito está vacío.</li>';
        total.textContent = 'Total: S/ 0.00';
        if (descuentoTexto) descuentoTexto.textContent = '';
        if (totalUsd) totalUsd.textContent = '';
        return;
    }

    const subtotal = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    const descuento = descuentoAplicado ? subtotal * 0.10 : 0;
    const totalFinal = subtotal - descuento;

    lista.innerHTML = carrito.map(item => `
    <li class="carrito-item">
      <div class="carrito-item-info">
        <strong>${item.nombre}</strong>
        <span>${formatearPrecio(item.precio * item.cantidad)}</span>
      </div>
      <div class="carrito-item-actions">
        <button class="qty-btn" data-action="decrease" data-id="${item.id}">−</button>
        <span class="qty-value">${item.cantidad}</span>
        <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
      </div>
    </li>
  `).join('');

    total.textContent = `Total: ${formatearPrecio(totalFinal)}`;
    if (descuentoTexto) {
        descuentoTexto.textContent = descuentoAplicado
            ? `Cupón aplicado: -${formatearPrecio(descuento)}`
            : '';
    }
    if (totalUsd) {
        totalUsd.textContent = tasaCambioUSD
            ? `≈ US$ ${(totalFinal * tasaCambioUSD).toFixed(2)}`
            : '';
    }
}

function cambiarCantidad(id, delta) {
    const item = carrito.find(producto => producto.id === id);
    if (!item) return;

    const nuevaCantidad = item.cantidad + delta;

    if (nuevaCantidad <= 0) {
        const confirmarEliminacion = window.confirm(`¿Estás seguro de que quieres eliminar ${item.nombre} del carrito?`);
        if (!confirmarEliminacion) {
            return;
        }

        carrito = carrito.filter(producto => producto.id !== id);
        mostrarMensaje('Producto eliminado del carrito');
    } else {
        item.cantidad = nuevaCantidad;
        mostrarMensaje('Cantidad actualizada');
    }

    actualizarContador();
    renderCarrito();
}

function agregarAlCarrito(id) {
    const producto = productos.find(item => item.id === id);
    if (!producto) return;

    const existente = carrito.find(item => item.id === id);
    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({ ...producto, precio: obtenerPrecioFinal(producto), cantidad: 1 });
    }

    actualizarContador();
    renderCarrito();
    mostrarMensaje(`${producto.nombre} agregado al carrito`);
}

function aplicarCupon() {
    const cuponInput = document.getElementById('cupon');
    const codigo = cuponInput ? cuponInput.value.trim().toUpperCase() : '';

    if (codigo === 'TECH10') {
        descuentoAplicado = true;
        mostrarMensaje('Cupón aplicado correctamente');
    } else {
        descuentoAplicado = false;
        mostrarMensaje('Cupón inválido', 'error');
    }

    renderCarrito();
}

function vaciar() {
    const confirmarVaciado = window.confirm('¿Estás seguro de que quieres vaciar el carrito?');
    if (!confirmarVaciado) {
        return;
    }

    carrito = [];
    descuentoAplicado = false;
    const cuponInput = document.getElementById('cupon');
    if (cuponInput) cuponInput.value = '';
    actualizarContador();
    renderCarrito();
    mostrarMensaje('Carrito vaciado');
}

function finalizarCompra() {
    if (!carrito.length) {
        mostrarMensaje('Agrega productos antes de finalizar', 'error');
        return;
    }

    mostrarMensaje('¡Compra finalizada con éxito, Vuelva pronto!');
    carrito = [];
    descuentoAplicado = false;
    const cuponInput = document.getElementById('cupon');
    if (cuponInput) cuponInput.value = '';
    actualizarContador();
    renderCarrito();
}

function mostrarAlertaFlotante(texto) {
    const alerta = document.getElementById('alertaFlotante');
    if (!alerta) return;

    alerta.textContent = texto;
    alerta.classList.add('show');

    clearTimeout(mostrarAlertaFlotante.timeoutId);
    mostrarAlertaFlotante.timeoutId = setTimeout(() => {
        alerta.classList.remove('show');
    }, 2600);
}

function seleccionarCategoria(categoria) {
    if (categoria === 'Ofertas') {
        mostrarSoloOfertas = true;
        filtroCategoria = 'Todas';
    } else {
        mostrarSoloOfertas = false;
        filtroCategoria = categoria;
    }

    renderFiltros();
    renderProductos();

    const seccionProductos = document.getElementById('ofertas');
    if (seccionProductos) {
        seccionProductos.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function inicializar() {
    renderFiltros();
    renderSkeletons();
    actualizarContador();
    renderCarrito();
    cargarTipoCambio();

    setTimeout(() => {
        renderProductos();
    }, 500);

    const categorias = document.getElementById('seccionesProductos');
    if (categorias) {
        categorias.addEventListener('click', (event) => {
            const tarjeta = event.target.closest('[data-categoria]');
            if (tarjeta) {
                seleccionarCategoria(tarjeta.dataset.categoria);
            }
        });

        categorias.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                const tarjeta = event.target.closest('[data-categoria]');
                if (tarjeta) {
                    event.preventDefault();
                    seleccionarCategoria(tarjeta.dataset.categoria);
                }
            }
        });
    }

    const buscador = document.getElementById('buscador');
    if (buscador) {
        const manejarBusqueda = debounce((valor) => {
            terminoBusqueda = valor;
            renderProductos();
        }, 300);

        buscador.addEventListener('input', (event) => {
            manejarBusqueda(event.target.value);
        });
    }

    const ordenSelect = document.getElementById('ordenarProductos');
    if (ordenSelect) {
        ordenSelect.addEventListener('change', (event) => {
            ordenActual = event.target.value;
            renderProductos();
        });
    }

    const filtros = document.getElementById('filtrosCategorias');
    if (filtros) {
        filtros.addEventListener('click', (event) => {
            const boton = event.target.closest('button[data-categoria]');
            if (!boton) return;

            seleccionarCategoria(boton.dataset.categoria);
        });
    }

    const contenedorProductos = document.getElementById('productos');
    if (contenedorProductos) {
        contenedorProductos.addEventListener('click', (event) => {
            const boton = event.target.closest('button[data-id]');
            if (boton) {
                agregarAlCarrito(Number(boton.dataset.id));
            }
        });
    }

    const listaCarrito = document.getElementById('lista');
    if (listaCarrito) {
        listaCarrito.addEventListener('click', (event) => {
            const boton = event.target.closest('button[data-action]');
            if (!boton) return;

            const id = Number(boton.dataset.id);
            const accion = boton.dataset.action;

            if (accion === 'increase') {
                cambiarCantidad(id, 1);
            } else if (accion === 'decrease') {
                cambiarCantidad(id, -1);
            }
        });
    }

    const btnCarrito = document.getElementById('btnCarrito');
    const modal = document.getElementById('modalCarrito');
    const cerrar = document.querySelector('.cerrar');

    if (btnCarrito && modal) {
        btnCarrito.addEventListener('click', abrirModal);
    }

    if (cerrar && modal) {
        cerrar.addEventListener('click', cerrarModal);
    }

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                cerrarModal();
            }
        });
    }

    // El logo ahora funciona como enlace estándar al inicio (href="#inicio"),
    // igual que en la web de la USS: no requiere JS adicional.

    // "Ver ofertas" ahora filtra directamente los productos con descuento
    const btnVerOfertas = document.getElementById('btnVerOfertas');
    if (btnVerOfertas) {
        btnVerOfertas.addEventListener('click', (event) => {
            event.preventDefault();
            seleccionarCategoria('Ofertas');
        });
    }

    inicializarAnimacionScroll();
}

// Animación 2: los elementos con clase "reveal" aparecen con fade + slide al entrar en pantalla
function inicializarAnimacionScroll() {
    const elementos = document.querySelectorAll('.reveal');
    if (!elementos.length) return;

    if (!('IntersectionObserver' in window)) {
        elementos.forEach(el => el.classList.add('visible'));
        return;
    }

    const observador = new IntersectionObserver((entradas) => {
        entradas.forEach(entrada => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add('visible');
                observador.unobserve(entrada.target);
            }
        });
    }, { threshold: 0.15 });

    elementos.forEach(el => observador.observe(el));
}

window.aplicarCupon = aplicarCupon;
window.vaciar = vaciar;
window.finalizarCompra = finalizarCompra;

document.addEventListener('DOMContentLoaded', inicializar);
