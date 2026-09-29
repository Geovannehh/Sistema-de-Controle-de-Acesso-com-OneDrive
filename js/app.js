// Inicializar ícones
lucide.createIcons();

// Variáveis de Estado (Em memória)
let registros = [];
let fotoAtualDataUrl = null;
let streamDeVideo = null;

// Elementos do DOM
const videoElement = document.getElementById('camera-feed');
const photoPreview = document.getElementById('photo-preview');
const canvasElement = document.getElementById('canvas');
const btnCapture = document.getElementById('btn-capture');
const btnRetake = document.getElementById('btn-retake');
const btnEntrada = document.getElementById('btn-entrada');
const btnSaida = document.getElementById('btn-saida');
const inputCpf = document.getElementById('cpf');
const inputNome = document.getElementById('nome');
const tabelaRegistos = document.getElementById('tabela-registos');
const clockElement = document.getElementById('clock');
const cameraLoading = document.getElementById('camera-loading');

// Atualizar Relógio
setInterval(() => {
    const now = new Date();
    clockElement.textContent = now.toLocaleTimeString('pt-PT');
}, 1000);

// Sistema de Notificações (Toasts)
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} flex items-center gap-2`;

    let icon = '';
    if (type === 'success') icon = '<i data-lucide="check-circle" class="w-5 h-5"></i>';
    if (type === 'error') icon = '<i data-lucide="alert-circle" class="w-5 h-5"></i>';
    if (type === 'info') icon = '<i data-lucide="info" class="w-5 h-5"></i>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons();

    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 10);

    // Remover após 4 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Inicializar Câmara
async function iniciarCamera() {
    try {
        streamDeVideo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        videoElement.srcObject = streamDeVideo;
        cameraLoading.style.display = 'none';
    } catch (err) {
        console.error("Erro ao aceder à câmara: ", err);
        cameraLoading.innerHTML = '<i data-lucide="camera-off" class="w-8 h-8 mb-2"></i> Câmara não encontrada ou permissão negada.';
        lucide.createIcons();
    }
}

// Capturar Fotografia
btnCapture.addEventListener('click', () => {
    if (!streamDeVideo) {
        showToast("A câmara não está disponível.", "error");
        return;
    }

    const context = canvasElement.getContext('2d');
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    // Obter imagem base64
    fotoAtualDataUrl = canvasElement.toDataURL('image/jpeg', 0.8);

    // Atualizar UI
    photoPreview.src = fotoAtualDataUrl;
    photoPreview.classList.remove('hidden');
    videoElement.classList.add('hidden');

    btnCapture.style.display = 'none';
    btnRetake.style.display = 'flex';
});

// Repetir Fotografia
btnRetake.addEventListener('click', () => {
    fotoAtualDataUrl = null;
    photoPreview.classList.add('hidden');
    videoElement.classList.remove('hidden');

    btnCapture.style.display = 'flex';
    btnRetake.style.display = 'none';
});

// Função Mock para simular Upload para o OneDrive
function simularUploadOneDrive(registroId) {
    const row = document.getElementById(`reg-${registroId}`);
    if (!row) return;
    const statusCell = row.querySelector('.onedrive-status');

    statusCell.innerHTML = `<span class="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs animate-pulse"><i data-lucide="cloud-upload" class="w-3 h-3"></i> A enviar...</span>`;
    lucide.createIcons();

    // Simula um atraso de rede (2 a 4 segundos)
    setTimeout(() => {
        statusCell.innerHTML = `<span class="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs"><i data-lucide="cloud-check" class="w-3 h-3"></i> Guardado</span>`;
        lucide.createIcons();
        showToast("Fotografia guardada no OneDrive com sucesso!", "success");
    }, 2000 + Math.random() * 2000);
}

// Renderizar Tabela
function atualizarTabela() {
    if (registros.length === 0) return;

    tabelaRegistos.innerHTML = '';

    // Inverter para mostrar os mais recentes primeiro
    [...registros].reverse().forEach(reg => {
        const tr = document.createElement('tr');
        tr.id = `reg-${reg.id}`;
        tr.className = 'hover:bg-gray-50';

        tr.innerHTML = `
            <td class="p-3">
                <img src="${reg.fotoUrl}" class="w-10 h-10 rounded-full object-cover border border-gray-200">
            </td>
            <td class="p-3 font-medium text-gray-800">${reg.cpf}</td>
            <td class="p-3">${reg.nome}</td>
            <td class="p-3 text-green-600 font-medium">${reg.entrada}</td>
            <td class="p-3 text-orange-500 font-medium">${reg.saida || '--:--:--'}</td>
            <td class="p-3 onedrive-status">
                ${reg.saida
                    ? `<span class="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs"><i data-lucide="cloud-check" class="w-3 h-3"></i> Guardado</span>`
                    : `<span class="inline-flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-1 rounded text-xs"><i data-lucide="cloud" class="w-3 h-3"></i> Aguardar</span>`
                }
            </td>
        `;
        tabelaRegistos.appendChild(tr);
    });
    lucide.createIcons();
}

// Registar Entrada
btnEntrada.addEventListener('click', () => {
    const cpf = inputCpf.value.trim();
    const nome = inputNome.value.trim();

    if (!cpf || !nome) {
        showToast("Por favor, preencha o CPF e o Nome.", "error");
        return;
    }
    if (!fotoAtualDataUrl) {
        showToast("Por favor, capture uma fotografia primeiro.", "error");
        return;
    }

    const now = new Date();
    const id = Date.now().toString();

    const novoRegisto = {
        id: id,
        cpf: cpf,
        nome: nome,
        entrada: now.toLocaleTimeString('pt-PT'),
        saida: null,
        fotoUrl: fotoAtualDataUrl
    };

    registros.push(novoRegisto);
    atualizarTabela();
    simularUploadOneDrive(id);

    showToast(`Entrada de ${nome} registada com sucesso!`, "success");

    // Limpar formulário
    inputCpf.value = '';
    inputNome.value = '';
    btnRetake.click(); // Volta a ligar a câmara
});

// Registar Saída
btnSaida.addEventListener('click', () => {
    const cpf = inputCpf.value.trim();

    if (!cpf) {
        showToast("Para registar a saída, preencha o CPF.", "error");
        return;
    }

    // Procurar a última entrada sem saída registada para este CPF
    let registoEncontrado = null;
    for (let i = registros.length - 1; i >= 0; i--) {
        if (registros[i].cpf === cpf && !registros[i].saida) {
            registoEncontrado = registros[i];
            break;
        }
    }

    if (!registoEncontrado) {
        showToast("Nenhuma entrada pendente encontrada para este CPF.", "error");
        return;
    }

    const now = new Date();
    registoEncontrado.saida = now.toLocaleTimeString('pt-PT');

    atualizarTabela();
    showToast(`Saída de ${registoEncontrado.nome} registada com sucesso!`, "success");

    // Limpar formulário
    inputCpf.value = '';
});

// Iniciar câmara quando a página carrega
window.addEventListener('load', iniciarCamera);
