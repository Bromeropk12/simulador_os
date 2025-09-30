// Simulador Round Robin - Script Principal

// Variables globales
let processes = [];
let quantum = 2;
let ganttChart = null;
let isStepMode = false;
let currentStep = 0;

// Elementos DOM
const processList = document.getElementById('process-list');
const addProcessBtn = document.getElementById('add-process');
const loadExampleBtn = document.getElementById('load-example');
const quantumInput = document.getElementById('quantum');
const startSimBtn = document.getElementById('start-sim');
const initStepSimBtn = document.getElementById('init-step-sim');
const nextStepBtn = document.getElementById('next-step');
const resetSimBtn = document.getElementById('reset-sim');
const cpuDisplay = document.getElementById('cpu-display');
const processQueue = document.getElementById('process-queue');
const ganttCanvas = document.getElementById('gantt-chart');
const resultsTable = document.querySelector('#results-table tbody');

// Event listeners
addProcessBtn.addEventListener('click', addProcess);
loadExampleBtn.addEventListener('click', loadExample);
quantumInput.addEventListener('change', updateQuantum);
startSimBtn.addEventListener('click', startSimulation);
initStepSimBtn.addEventListener('click', initStepMode);
nextStepBtn.addEventListener('click', nextStep);
resetSimBtn.addEventListener('click', resetSimulation);

// Funciones principales
function addProcess() {
    const name = `P${processes.length + 1}`;
    processes.push({ name, burstTime: 1 });
    renderProcessList();
}

function loadExample() {
    // Cargar procesos de ejemplo
    processes = [
        { name: 'P1', burstTime: 7 },
        { name: 'P2', burstTime: 4 },
        { name: 'P3', burstTime: 3 },
        { name: 'P4', burstTime: 5 }
    ];
    renderProcessList();
}

function updateQuantum() {
    quantum = parseInt(quantumInput.value);
}

function startSimulation() {
    if (processes.length === 0) {
        alert('Agregue procesos primero');
        return;
    }
    isStepMode = false;
    runRoundRobin();
}

function initStepMode() {
    if (processes.length === 0) {
        alert('Agregue procesos primero');
        return;
    }
    initializeStepMode();
    nextStepBtn.disabled = false;
}

function nextStep() {
    nextStepSimulation();
}

function resetSimulation() {
    // Reiniciar
    processes = [];
    renderProcessList();
    cpuDisplay.textContent = 'CPU: Idle';
    processQueue.innerHTML = '';
    resultsTable.innerHTML = '';
    if (ganttChart) {
        ganttChart.destroy();
    }
    currentStep = 0;
    nextStepBtn.disabled = true;
}

// Lógica Round Robin
function runRoundRobin() {
    let queue = [...processes.map(p => ({ ...p, remainingTime: p.burstTime }))];
    let time = 0;
    let ganttData = [];
    let completed = [];
    let step = 0;

    function executeStep() {
        if (queue.length === 0) {
            displayResults(completed, ganttData);
            return;
        }

        let process = queue.shift();
        let execTime = Math.min(quantum, process.remainingTime);
        
        ganttData.push({ process: process.name, start: time, end: time + execTime });
        
        // Animar
        animateExecution(process.name, execTime);
        renderProcessQueueAnim(queue);
        
        setTimeout(() => {
            time += execTime;
            process.remainingTime -= execTime;
            
            if (process.remainingTime > 0) {
                queue.push(process);
            } else {
                process.completionTime = time;
                process.turnaroundTime = time;
                process.waitingTime = process.turnaroundTime - process.burstTime;
                completed.push(process);
            }
            
            step++;
            executeStep();
        }, execTime * 500); // Simular tiempo
    }

    executeStep();
}

function renderProcessQueueAnim(queue) {
    processQueue.innerHTML = '';
    queue.forEach((p, index) => {
        const div = document.createElement('div');
        div.className = 'process-block';
        div.textContent = `${p.name} (${p.remainingTime})`;
        processQueue.appendChild(div);
        
        // Animar entrada
        anime({
            targets: div,
            translateX: [50, 0],
            opacity: [0, 1],
            duration: 500,
            delay: index * 100,
            easing: 'easeOutQuad'
        });
    });
}

let stepQueue = [];
let stepTime = 0;
let stepCompleted = [];
let stepGanttData = [];

function initializeStepMode() {
    stepQueue = [...processes.map(p => ({ ...p, remainingTime: p.burstTime }))];
    stepTime = 0;
    stepCompleted = [];
    stepGanttData = [];
    currentStep = 0;
    renderProcessQueue();
}

function nextStepSimulation() {
    if (stepQueue.length === 0) {
        displayResults(stepCompleted, stepGanttData);
        nextStepBtn.disabled = true;
        return;
    }

    let process = stepQueue.shift();
    let execTime = Math.min(quantum, process.remainingTime);
    
    stepGanttData.push({ process: process.name, start: stepTime, end: stepTime + execTime });
    
    // Animar ejecución
    animateExecution(process.name, execTime);
    
    stepTime += execTime;
    process.remainingTime -= execTime;
    
    if (process.remainingTime > 0) {
        stepQueue.push(process);
    } else {
        process.completionTime = stepTime;
        process.turnaroundTime = stepTime;
        process.waitingTime = process.turnaroundTime - process.burstTime;
        stepCompleted.push(process);
    }
    
    renderProcessQueue();
    currentStep++;
}

function animateExecution(processName, duration) {
    cpuDisplay.textContent = `CPU: Ejecutando ${processName}`;
    cpuDisplay.style.color = '#FFA500';
    
    // Animación con Anime.js
    anime({
        targets: '#cpu-display',
        scale: [1, 1.2, 1],
        duration: duration * 500, // Simular tiempo real
        easing: 'easeInOutQuad',
        complete: () => {
            cpuDisplay.textContent = 'CPU: Idle';
            cpuDisplay.style.color = '#00FF00';
        }
    });
}

function renderProcessQueue() {
    processQueue.innerHTML = '';
    stepQueue.forEach(p => {
        const div = document.createElement('div');
        div.className = 'process-block';
        div.textContent = `${p.name} (${p.remainingTime})`;
        processQueue.appendChild(div);
    });
}

function displayResults(completed, ganttData) {
    // Mostrar tabla de resultados
    resultsTable.innerHTML = '';
    completed.forEach(p => {
        const row = `<tr>
            <td>${p.name}</td>
            <td>${p.burstTime}</td>
            <td>${p.waitingTime}</td>
            <td>${p.turnaroundTime}</td>
        </tr>`;
        resultsTable.innerHTML += row;
    });

    // Diagrama de Gantt
    renderGanttChart(ganttData);
}

function renderGanttChart(ganttData) {
    const ctx = ganttCanvas.getContext('2d');
    if (ganttChart) ganttChart.destroy();
    
    // Preparar datos para Gantt: barras horizontales por ejecución
    const sortedGantt = ganttData.sort((a, b) => a.start - b.start);
    const labels = sortedGantt.map(d => `${d.process} (${d.start}-${d.end} S)`);
    const data = sortedGantt.map(d => d.end - d.start);
    const colors = sortedGantt.map(d => {
        const processNames = [...new Set(ganttData.map(g => g.process))];
        const index = processNames.indexOf(d.process);
        return `hsl(${index * 60}, 100%, 50%)`;
    });
    
    ganttChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Duración de Ejecución (S)',
                data: data,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 2
            }]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Duración (S)'
                    },
                    ticks: {
                        stepSize: 1
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Ejecuciones'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Duración: ${context.parsed.x} S`;
                        }
                    }
                }
            }
        }
    });
}

function renderProcessList() {
    processList.innerHTML = '';
    processes.forEach((process, index) => {
        const div = document.createElement('div');
        div.className = 'process-item';
        div.innerHTML = `
            <span>${process.name}</span>
            <input type="number" value="${process.burstTime}" min="1" onchange="updateProcess(${index}, this.value)">
            <button class="remove-process" onclick="removeProcess(${index})">Remover</button>
        `;
        processList.appendChild(div);
    });
}

function updateProcess(index, burstTime) {
    processes[index].burstTime = parseInt(burstTime);
}

function removeProcess(index) {
    processes.splice(index, 1);
    renderProcessList();
}

// Inicialización
loadExample(); // Cargar ejemplos por defecto