import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Existing code...

// After line 139 (after checking demo users)
const studentInput = getStudentInput(); // Assuming this function gets the input.

if (/^IBI-GYM\d{6}$/.test(studentInput)) {
    // Search by ID
    const alumno = await searchById(studentInput);
    if (alumno) {
        validateStudent(alumno);
    }
} else if (/^[A-Z0-9]{18}$/.test(studentInput)) {
    // Search by CURP
    const alumno = await searchByCurp(studentInput);
    if (alumno) {
        validateStudent(alumno);
    }
}

function validateStudent(alumno) {
    if (alumno.password !== "Gymnastics2026") {
        console.log("Invalid password.");
        return;
    }
    if (alumno.requireCambioPassword) {
        showModalCambioPassword(alumno);
    }
    if (new Date() > new Date(alumno.vencimiento)) {
        console.log("Membership expired.");
    }
}

function showModalCambioPassword(alumno) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('modalCambioPassword').style.display = 'block';
    sessionStorage.setItem('currentAlumno', JSON.stringify(alumno));
}

async function cambiarPasswordAlumno(alumnoID, newPassword) {
    if (newPassword.length < 8) {
        return { success: false, message: "Password must be at least 8 characters." };
    }
    const db = getFirestore();
    await updateDoc(doc(db, 'alumnos', alumnoID), {
        password: newPassword,
        requireCambioPassword: false,
        fechaUltimoCambioPassword: new Date().toISOString()
    });
    return { success: true };
}

document.getElementById('formCambioPassword').addEventListener('submit', async (event) => {
    event.preventDefault();
    const newPassword = event.target.newPassword.value;
    const confirmationPassword = event.target.confirmationPassword.value;
    if (newPassword !== confirmationPassword) {
        console.log("Passwords do not match.");
        return;
    }
    const currentAlumno = JSON.parse(sessionStorage.getItem('currentAlumno'));
    const result = await cambiarPasswordAlumno(currentAlumno.id, newPassword);
    if (result.success) {
        document.getElementById('modalCambioPassword').style.display = 'none';
        showStudentPanel(); // Assuming this shows the student panel
    } else {
        console.error(result.message);
    }
});
