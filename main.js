/* ============================================================
   CONFIGURACIÓN Y SEGURIDAD (FUERA DEL READY)
============================================================ */
window.logout = function() {
    localStorage.removeItem("session");
    window.location.href = "login.html";
};

(function verificarSesion() {
    const sesion = localStorage.getItem("session");
    const esLogin = window.location.pathname.includes("login.html");
    if (!sesion && !esLogin) window.location.href = "login.html";
})();

if(!localStorage.getItem("saldo")) localStorage.setItem("saldo", "100000");

$(document).ready(function () { 

    // --- ANIMACIONES INICIALES ---
    $(".card").hide().fadeIn(1000); 
    $(".navbar").css("margin-top", "-100px").animate({"margin-top": "0px"}, 600);

    // --- FUNCIÓN REGISTRAR MOVIMIENTO ---
    function registrarMovimiento(tipo, monto, motivo) {
        let movs = JSON.parse(localStorage.getItem("movimientos") || "[]");
        movs.push({ tipo, monto, motivo, fecha: new Date().toLocaleString() });
        localStorage.setItem("movimientos", JSON.stringify(movs));
    }

    // --- ACTUALIZACIÓN DINÁMICA DE SALDO ---
    function actualizarSaldoUI() {
        const saldo = localStorage.getItem("saldo");
        const $saldoElement = $("#saldo");
        if ($saldoElement.length) {
            $saldoElement.fadeOut(200, function() {
                $(this).text("$" + Number(saldo).toLocaleString('es-CL')).fadeIn(200);
            });
        }
    }
    actualizarSaldoUI();

    // --- LOGIN ---
    $("#loginForm").on("submit", function (e) {
        e.preventDefault();
        const email = $("#email").val();
        const pass = $("#password").val();
        if (email === "daniel@gmail.com" && pass === "123456") {
            localStorage.setItem("session", "activa");
            $("#alertaLogin").html('<div class="alert alert-success">¡Bienvenido!</div>').slideDown();
            setTimeout(() => { window.location.href = "menu.html"; }, 1200);
        } else {
            $("#alertaLogin").html('<div class="alert alert-danger">Datos incorrectos</div>');
        }
    });

    // --- CONTACTOS Y BÚSQUEDA ---
    function renderContacts(filtro = "") {
        if (!$("#contactsList").length) return;
        const contacts = JSON.parse(localStorage.getItem("contacts") || "[]");
        $("#contactsList").empty();
        const filtrados = contacts.filter(c => 
            c.name.toLowerCase().includes(filtro.toLowerCase()) || c.cbu.includes(filtro)
        );
        filtrados.forEach((c, i) => {
            $("#contactsList").append(`
                <li class="list-group-item list-group-item-action contact-item border-0 mb-1 rounded shadow-sm" data-index="${i}" style="cursor:pointer;">
                    <div class="d-flex justify-content-between align-items-center">
                        <div><strong>${c.name}</strong><br><small class="text-muted">${c.bank}</small></div>
                        <span class="badge bg-primary-alke p-2">Seleccionar</span>
                    </div>
                </li>`);
        });
    }
    renderContacts();

    $("#searchContact").on("keyup", function() {
        renderContacts($(this).val());
    });

    $(document).on("click", ".contact-item", function() {
        $(".contact-item").removeClass("bg-light border-primary");
        $(this).addClass("bg-light border-primary");
        window.selectedContactIndex = $(this).data("index");
        $("#amountContainer").slideDown();
    });

    // --- DEPÓSITO ---
    $("#btnDeposit").click(function() {
        const monto = Number($("#depositAmount").val());
        if (monto > 0) {
            let saldo = Number(localStorage.getItem("saldo"));
            saldo += monto;
            localStorage.setItem("saldo", saldo);
            registrarMovimiento("Depósito", monto, "Carga de fondos");
            $("#depositAlert").html('<div class="alert alert-success">¡Éxito!</div>').slideDown();
            actualizarSaldoUI();
            setTimeout(() => { window.location.href = "menu.html"; }, 1500);
        }
    });

    // --- ENVÍO DE DINERO ---
    $("#btnConfirmSend").click(function() {
        const monto = Number($("#inputMonto").val());
        let saldo = Number(localStorage.getItem("saldo"));
        const contacts = JSON.parse(localStorage.getItem("contacts"));
        const contacto = contacts[window.selectedContactIndex];

        if (monto > 0 && monto <= saldo && contacto) {
            saldo -= monto;
            localStorage.setItem("saldo", saldo);
            registrarMovimiento("Envío", monto, `A ${contacto.name}`);
            $("#sendAlert").html('<div class="alert alert-success">¡Enviado!</div>').fadeIn();
            actualizarSaldoUI();
            setTimeout(() => { window.location.href = "menu.html"; }, 1500);
        } else {
            $("#sendAlert").html('<div class="alert alert-danger">Error en el envío</div>');
        }
    });

    // --- FILTRO DE MOVIMIENTOS ---
    if ($("#movimientosList").length) {
        function cargarMovimientos(filtro = "all") {
            let movs = JSON.parse(localStorage.getItem("movimientos") || "[]");
            $("#movimientosList").empty();
            
            let filtrados = movs.filter(m => 
                filtro === "all" || 
                (filtro === "deposit" && m.tipo === "Depósito") || 
                (filtro === "send" && m.tipo === "Envío")
            );

            if (filtrados.length === 0) {
                $("#movimientosList").append('<p class="text-center py-4 text-muted">No hay registros</p>');
            } else {
                filtrados.reverse().forEach(m => {
                    const detalle = m.motivo ? m.motivo : (m.tipo === "Depósito" ? "Carga de fondos" : "Transacción");
                    $("#movimientosList").append(`
                        <div class="list-group-item d-flex justify-content-between py-3 border-0 border-bottom">
                            <div>
                                <h6 class="mb-0 fw-bold">${m.tipo}</h6>
                                <div class="small text-dark fw-medium">${detalle}</div>
                                <small class="text-muted" style="font-size: 0.75rem;">${m.fecha}</small>
                            </div>
                            <span class="${m.tipo === 'Depósito' ? 'text-success' : 'text-danger'} fw-bold">
                                ${m.tipo === 'Depósito' ? '+' : '-'}$${Number(m.monto).toLocaleString('es-CL')}
                            </span>
                        </div>`).hide().fadeIn(400);
                });
            }
        }
        cargarMovimientos();
        $("#filterMov").on("change", function() { cargarMovimientos($(this).val()); });
    }


});
// Módulo de transacciones e historial completado
