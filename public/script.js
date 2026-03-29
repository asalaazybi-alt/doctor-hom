const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultDiv = document.getElementById("result");

// 1. تشغيل الكاميرا بتوافقية عالية (كمبيوتر وجوال)
async function initCamera() {
    try {
        // نستخدم ideal بدلاً من فرض الكاميرا الخلفية
        const constraints = { 
            video: { 
                facingMode: { ideal: "environment" } 
            } 
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
    } catch (err) {
        console.error("Camera Error:", err);
        
        // محاولة بديلة في حال فشل الكود السابق (خاصة للكمبيوتر)
        try {
            const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = simpleStream;
        } catch (secondErr) {
            resultDiv.innerHTML = "❌ خطأ: لم نتمكن من الوصول للكاميرا. تأكد من منح الصلاحية في المتصفح.";
        }
    }
}

// 2. الوظيفة الرئيسية لالتقاط الصورة وإرسالها للسيرفر
async function analyzeImage() {
    // التأكد من أن الكاميرا تعمل قبل الالتقاط
    if (!video.videoWidth) {
        resultDiv.textContent = "❌ الكاميرا لم تعمل بعد، انتظر ثانية وحاول مجدداً.";
        return;
    }

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.7);

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "جاري التحليل... انتظر";
    resultDiv.style.color = "#333";
    resultDiv.textContent = "يتم الآن إرسال الصورة للذكاء الاصطناعي...";

    try {
        const response = await fetch("/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imageData })
        });

        const data = await response.json();

        if (data.success) {
            resultDiv.innerText = data.result;
        } else {
            resultDiv.style.color = "red";
            resultDiv.innerText = "⚠️ خطأ: " + (data.error || "فشل التحليل");
        }
    } catch (error) {
        resultDiv.style.color = "red";
        resultDiv.innerText = "❌ فشل الاتصال بالسيرفر. تأكد من تشغيل السيرفر و ngrok.";
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "التقاط وتحليل الحالة";
    }
}

// 3. ربط الأحداث
analyzeBtn.addEventListener("click", analyzeImage);

// تشغيل الكاميرا تلقائياً عند تحميل الصفحة
initCamera();