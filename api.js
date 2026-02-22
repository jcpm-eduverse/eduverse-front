const API_BASE = "https://api-eduverse.onrender.com";

const EduVerseAPI = {
    // --- AUTH & LOGIN ---
    async loginTeacher(payload) {
        return await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },

    async loginStudent(payload) {
        return await fetch(`${API_BASE}/students/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
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
            body: JSON.stringify(payload)
        });
    },

    async getMyTasks(studentId) {
        const token = localStorage.getItem('edu_token');
        const response = await fetch(`${API_BASE}/tasks/student/${studentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // TOLERÂNCIA ZERO: Se a API explodir (500) ou negar (403), o JS aborta e protege a tela.
        if (!response.ok) {
            throw new Error(`Erro na API. Status: ${response.status}`);
        }
        
        return await response.json();
    },

    // --- PROFESSOR & TURMAS (CLASS-ROOM-CONTROLLER) ---
    // --- PROFESSOR & TURMAS (CLASS-ROOM-CONTROLLER) ---
    async getMyClassrooms() {
        const token = localStorage.getItem('edu_token');
        
        // A ROTA CORRETA DO PROFESSOR AQUI:
        const response = await fetch(`${API_BASE}/classrooms/teacher-classrooms`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 403) {
            console.warn("Acesso negado (403): Verifique se o seu usuário possui ROLE_TEACHER ou se o backend foi atualizado.");
        }

        return response;
    },

    async createClassroom(payload) {
        const token = localStorage.getItem('edu_token');
        return fetch(`${API_BASE}/classrooms/new-classroom`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    },

    // --- MISSÕES (TASK-CONTROLLER) ---
    async createTask(payload) {
        const token = localStorage.getItem('edu_token');
        return fetch(`${API_BASE}/tasks/new-task`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    },

    // --- PRESENÇA (ATTENDANCE-CONTROLLER) ---
    async markAttendance(payload) {
        const token = localStorage.getItem('edu_token');
        return fetch(`${API_BASE}/attendance`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    },

    async getClassStudents(classroomId) {
        const token = localStorage.getItem('edu_token');
        // Usando a rota de busca de estudantes vinculada à lógica de turmas
        const response = await fetch(`${API_BASE}/students/get-students`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    }
};

// Funções auxiliares para manipulação de interface (Exemplo: Chamada de Alunos)
async function openAttendanceModal(classroomId) {
    const modal = document.getElementById('attendanceModal');
    const list = document.getElementById('attendanceList');
    const classIdInput = document.getElementById('attendanceClassroomId');
    
    if(classIdInput) classIdInput.value = classroomId;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    list.innerHTML = "<tr><td colspan='3' class='text-center py-4 text-slate-400'>Buscando heróis...</td></tr>";

    try {
        const students = await EduVerseAPI.getClassStudents(classroomId);
        list.innerHTML = "";

        if (students.length === 0) {
            list.innerHTML = "<tr><td colspan='3' class='text-center py-4 text-slate-400'>Nenhum aluno nesta turma.</td></tr>";
            return;
        }

        students.forEach(student => {
            list.innerHTML += `
                <tr class="border-b border-slate-50 last:border-0">
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
        list.innerHTML = "<tr><td colspan='3' class='text-center py-4 text-red-500'>Erro ao carregar lista.</td></tr>";
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
        // Envolvemos o objeto em um Array para respeitar o ArrayList do Java
        const res = await EduVerseAPI.markAttendance([payload]);
        
        if(res.ok) {
            const statusEl = document.getElementById(`status-${studentId}`);
            statusEl.innerText = "Registrado ✅";
            statusEl.className = "text-[9px] font-black text-emerald-500 uppercase tracking-widest";
        } else {
            // TOLERÂNCIA ZERO: Nunca deixe um erro silencioso passar
            console.error("Servidor recusou a presença. Status:", res.status);
            alert("Erro ao registrar presença. Tente novamente.");
        }
    } catch (e) {
        console.error("Erro ao registrar presença:", e);
    }
}
