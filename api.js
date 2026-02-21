const API_BASE = "https://api-eduverse.onrender.com";

const EduVerseAPI = {
    // --- AUTH & LOGIN ---
    async login(payload) {
        // O dev passou /auth/login e /students/login. Vamos usar o /auth/login que é o padrão.
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return response;
    },

    // --- ALUNO (STUDENT-CONTROLLER) ---
    async joinClass(payload) {
        const token = localStorage.getItem('edu_token');
        return fetch(`${API_BASE}/students/join-class`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload) // { "code": "..." }
        });
    },

    async getMyTasks(studentId) {
        const token = localStorage.getItem('edu_token');
        // Rota do dev: /tasks/student/{studentId}
        const response = await fetch(`${API_BASE}/tasks/student/${studentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    // --- PROFESSOR & TURMAS (CLASS-ROOM / TEACHER CONTROLLER) ---
    async getMyClassrooms() {
        const token = localStorage.getItem('edu_token');
        // Rota do dev: /classrooms/get-classrooms
        const response = await fetch(`${API_BASE}/classrooms/get-classrooms`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    // --- TAREFAS (TASK-CONTROLLER) ---
    async createTask(payload) {
        const token = localStorage.getItem('edu_token');
        // Rota do dev: /tasks/new-task
        return fetch(`${API_BASE}/tasks/new-task`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    },

    // --- FREQUÊNCIA (ATTENDANCE-CONTROLLER) ---
    async getClassroomStudents(classRoomId) {
        const token = localStorage.getItem('edu_token');
        // Rota do dev: /attendance/sheet/{classRoomId} 
        // (Geralmente retorna a lista de alunos para a chamada)
        const response = await fetch(`${API_BASE}/attendance/sheet/${classRoomId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async markAttendance(attendanceData) {
        const token = localStorage.getItem('edu_token');
        // Rota do dev: /attendance (POST)
        return fetch(`${API_BASE}/attendance`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(attendanceData)
        });
    }
};

// --- FUNÇÕES DE INTERFACE ---

async function loadAttendanceList(classroomId) {
    const table = document.getElementById('attendanceTable');
    try {
        // Busca a folha de chamada da turma
        const students = await EduVerseAPI.getClassroomStudents(classroomId);
        table.innerHTML = ""; 

        students.forEach(student => {
            table.innerHTML += `
                <tr class="border-b last:border-0">
                    <td class="py-4 font-semibold text-slate-700">${student.name}</td>
                    <td class="py-4 text-xs text-slate-400 font-bold" id="status-${student.id}">Pendente</td>
                    <td class="py-4 text-right">
                        <button onclick="confirmAttendance(${student.id}, ${classroomId})" 
                                class="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition">
                            Presença
                        </button>
                    </td>
                </tr>`;
        });
    } catch (e) {
        console.error("Erro ao carregar lista:", e);
    }
}

async function confirmAttendance(studentId, classroomId) {
    const dateInput = document.getElementById('attendanceDate');
    const date = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];

    const payload = {
        studentId: studentId,
        classroomId: classroomId,
        present: true,
        date: date
    };

    try {
        const res = await EduVerseAPI.markAttendance(payload);
        if(res.ok) {
            const statusEl = document.getElementById(`status-${studentId}`);
            statusEl.innerText = "Registrado ✅";
            statusEl.className = "text-xs font-bold text-emerald-500";
        }
    } catch (err) {
        alert("Erro ao conectar com servidor.");
    }
}