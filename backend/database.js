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
  },
  {
    question: '¿Qué es XUMTECH y desde cuándo opera?',
    keywords: 'empresa,historia,fundacion,xumtech,suum',
    answer: 'XUMTECH (anteriormente SUUM Technologies) es una empresa fundada en 2015, especializada en Customer Experience y transformación digital. Somos Partner Oracle galardonado en Centroamérica y Caribe durante dos años consecutivos.'
  },
  {
    question: '¿Qué significa ser Partner Oracle galardonado?',
    keywords: 'oracle,partner,premio,certificacion,galardon',
    answer: 'XUMTECH ha sido galardonado como Partner del Año de Oracle en Centroamérica y Caribe durante dos años consecutivos, reconociendo nuestra experiencia y excelentes resultados en implementaciones de Oracle Cloud Applications.'
  },
  {
    question: '¿Qué metodología utilizan para las implementaciones?',
    keywords: 'metodologia,implementacion,cloud,aplicaciones',
    answer: 'Utilizamos la metodología Cloud Application Services que asegura implementaciones exitosas, el logro de objetivos de negocio e impacto en los procesos de mercadeo, ventas, servicio, lealtad y comercio digital.'
  }
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