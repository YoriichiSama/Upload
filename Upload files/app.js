const TELEGRAM_BOT_TOKEN = "7651789586:AAE07uomZ3OlhUj3OgvjqihWBjf34LJVsmg"; // توكن البوت
const CHAT_ID = "6196901763"; // معرف الشات أو القناة

const uploadForm = document.getElementById("uploadForm");
const responseMessage = document.getElementById("responseMessage");
const loadingMessage = document.getElementById("loadingMessage"); // مؤشر التحميل
const fileInput = document.getElementById("fileInput");

// إضافة عنصر الصوت
const successSound = document.getElementById("successSound");

uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // إخفاء الرسائل السابقة
    responseMessage.classList.add("hidden");

    if (!fileInput.files.length) {
        responseMessage.innerText = "يرجى اختيار ملف.";
        responseMessage.classList.remove("hidden");
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("chat_id", CHAT_ID);
    formData.append("document", file);

    try {
        loadingMessage.classList.remove("hidden"); // إظهار مؤشر التحميل
        
        // تحقق من البصمة للتأكد من عدم تكرار الملف
        const fileHash = await getFileHash(file);
        const isDuplicate = checkFileInLocalStorage(fileHash);
        if (isDuplicate) {
            responseMessage.innerText = "تم رفع هذا الملف سابقاً.";
            responseMessage.classList.remove("hidden");
            return;
        }

        // الحصول على التاريخ والوقت الحالي
        const currentDateTime = new Date().toLocaleString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        // إضافة التاريخ والوقت إلى تعليق الملف
        const caption = `تم رفع هذا الملف في: ${currentDateTime}`;

        // إرسال الملف إلى تليجرام مع التعليق
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
            method: "POST",
            body: new URLSearchParams({
                chat_id: CHAT_ID,
                caption: caption,  // أضفنا هنا التعليق
            }).toString(),
        });

        // الآن نحن نرسل الملف والـ caption معاً
        const formDataWithFile = new FormData();
        formDataWithFile.append("chat_id", CHAT_ID);
        formDataWithFile.append("document", file);
        formDataWithFile.append("caption", caption);

        const fileResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
            method: "POST",
            body: formDataWithFile
        });

        const result = await fileResponse.json();
        if (fileResponse.ok && result.ok) {
            saveFileHashToLocalStorage(fileHash);
            responseMessage.innerText = "تم رفع الملف وإرساله بنجاح!";
            responseMessage.classList.remove("hidden");
            
            // تشغيل الصوت عند النجاح
            successSound.play(); // تشغيل الصوت عند نجاح رفع الملف
        } else {
            responseMessage.innerText = "فشل إرسال الملف إلى تليجرام: " + (result.description || "حدث خطأ");
            responseMessage.classList.remove("hidden");
        }
    } catch (error) {
        console.error(error);
        responseMessage.innerText = "حدث خطأ. يرجى المحاولة مرة أخرى.";
        responseMessage.classList.remove("hidden");
    } finally {
        loadingMessage.classList.add("hidden"); // إخفاء مؤشر التحميل
        fileInput.value = ""; // إعادة تعيين حقل الإدخال بعد رفع الملف
    }
});

// دالة لحساب البصمة باستخدام SHA-256
async function getFileHash(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// التحقق من الملف في localStorage
function checkFileInLocalStorage(hash) {
    const uploadedFiles = JSON.parse(localStorage.getItem("uploadedFiles")) || [];
    return uploadedFiles.includes(hash);
}

// حفظ البصمة في localStorage
function saveFileHashToLocalStorage(hash) {
    const uploadedFiles = JSON.parse(localStorage.getItem("uploadedFiles")) || [];
    if (!uploadedFiles.includes(hash)) {
        uploadedFiles.push(hash);
        localStorage.setItem("uploadedFiles", JSON.stringify(uploadedFiles));
    }
}

// إضافة فئة "loaded" إلى الجسم عند تحميل الصفحة
window.addEventListener("load", () => {
    document.body.classList.add("loaded");
});
