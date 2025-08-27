const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB2bs_z4s2ELgXNzFErHq5opnQbvN4eVNw",
  authDomain: "xumtech-chatbot-799da.firebaseapp.com",
  projectId: "xumtech-chatbot-799da",
  storageBucket: "xumtech-chatbot-799da.firebasestorage.app",
  messagingSenderId: "762621610010",
  appId: "1:762621610010:web:80b5877a839414a3d9e9a3",
  measurementId: "G-TMMM5R3LMC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para inicializar datos de ejemplo
const initializeData = async () => {
  const sampleData = [
    {
      question: '¿Qué servicios ofrece XUMTECH?',
      keywords: 'servicios,cx,customer experience,oracle,crm',
      answer: 'XUMTECH se especializa en Customer Experience (CX), consultoría e implementación de soluciones Oracle Cloud, transformación digital, CRM, ERP, automatización de ventas y omnicanalidad en atención al cliente.'
    },
    {
      question: '¿Cómo puedo contactar a XUMTECH?',
      keywords: 'contacto,telefono,email,comunicar',
      answer: 'Puedes contactarnos al teléfono +506 2205-5458 o visitar nuestro sitio web www.xum-tech.com. Estamos ubicados en Belén, Heredia, Costa Rica.'
    }
    // Agregar más datos aquí si quieres
  ];

  try {
    for (const data of sampleData) {
      await addDoc(collection(db, 'qa_pairs'), data);
    }
    console.log('Datos inicializados en Firebase');
  } catch (error) {
    console.error('Error inicializando datos:', error);
  }
};

console.log('Firebase conectado correctamente');

module.exports = { db, initializeData };