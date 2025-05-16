const inputs = document.querySelectorAll(".login__input-field");
const toggle_btn = document.querySelectorAll(".login__toggle");
const main = document.querySelector("main");

inputs.forEach((inp) => {
    inp.addEventListener("focus", () => {
        inp.classList.add("active");
    });
    inp.addEventListener("blur", () => {
        if (inp.value != "") return;
        inp.classList.remove("active");
    });
});

const passwordInput = document.getElementById("password");
const togglePasswordButton = document.getElementById("togglePassword");

togglePasswordButton.addEventListener("click", function () {
    const isVisible = togglePasswordButton.getAttribute("data-visible") === "true";

    if (isVisible) {
        passwordInput.type = "Password"; // Ẩn mật khẩu
        togglePasswordButton.setAttribute("data-visible", "false");
        togglePasswordButton.querySelector(".material-symbols-outlined").textContent = "visibility";
    } else {
        passwordInput.type = "text"; // Hiển thị mật khẩu
        togglePasswordButton.setAttribute("data-visible", "true");
        togglePasswordButton.querySelector(".material-symbols-outlined").textContent = "visibility_off";
    }
});

const form = document.getElementById('form');
const adminLogin = document.getElementById('adminLogin');
const password = document.getElementById('password');

form.addEventListener('submit', e => {
    e.preventDefault();

    validateInput();
});


const setError = (element, message) => {
    const inputControl = element.parentElement;
    const errorDisplay = inputControl.querySelector(`.login__error`);

    errorDisplay.innerText = message;
    inputControl.classList.add('error');
    inputControl.classList.remove('success');  // Fixed: was incorrectly removing 'error' instead of 'success'
}

const setSuccess = element => {
    const inputControl = element.parentElement;
    const errorDisplay = inputControl.querySelector(`.login__error`);

    errorDisplay.innerText = '';
    inputControl.classList.add('success');
    inputControl.classList.remove('error');
}

const validateInput = () => {
    const adminLoginValue = adminLogin.value.trim();
    const passwordValue = password.value.trim();

    console.log("[ADMIN LOGIN CLIENT] Form values:", { 
        adminLoginId: adminLogin.id,
        passwordId: password.id, 
        adminLoginValue, 
        passwordLength: passwordValue.length 
    });

    let isAllValid = true;

    if (adminLoginValue === '') {
        setError(adminLogin, 'Vui lòng nhập tên đăng nhập!');
        isAllValid = false;
    } else if (adminLoginValue.length != 8) {
        setError(adminLogin, 'Tên đăng nhập không đúng định dạng!')
        isAllValid = false;
    } else {
        setSuccess(adminLogin);
    }

    if (passwordValue === '') {
        setError(password, 'Vui lòng nhập mật khẩu!');
        isAllValid = false;
    } else if (passwordValue.length < 8) {
        setError(password, 'Mật khẩu phải ít nhất 8 ký tự!')
        isAllValid = false;
    } else {
        setSuccess(password);
    }

    if (isAllValid) {
        console.log("[ADMIN LOGIN CLIENT] Validation passed, sending request");
        
        // Create the payload explicitly matching what the backend expects
        const loginData = {
            admin_login_name: adminLoginValue,
            admin_password: passwordValue
        };
        
        console.log("[ADMIN LOGIN CLIENT] Payload:", loginData);
        
        // Use fetch with detailed logging
        fetch("/admin/login", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginData)
        })
        .then(res => {
            console.log("[ADMIN LOGIN CLIENT] Response status:", res.status);
            return res.json();
        })
        .then(data => {
            console.log("[ADMIN LOGIN CLIENT] Response data:", data);
            
            if (data.status === "success") {
                alert('Đăng Nhập Thành Công');
                console.log("[ADMIN LOGIN CLIENT] Login successful, redirecting to:", data.redirectUrl);
                
                // Force hard navigation to admin page
                window.location = data.redirectUrl || '/admin';
            } 
            else if (data.status === "error") {
                console.log("[ADMIN LOGIN CLIENT] Login failed:", data.message);
                setError(adminLogin, data.message);
            }
            else if (data.status === "error2") {
                console.log("[ADMIN LOGIN CLIENT] Password error:", data.message);
                setError(password, data.message);
            }
            else {
                console.log("[ADMIN LOGIN CLIENT] Unknown response:", data);
                alert("Đã xảy ra lỗi không xác định. Vui lòng thử lại!");
            }
        })
        .catch(err => {
            console.error("[ADMIN LOGIN CLIENT] Fetch error:", err);
            alert("Lỗi kết nối! Vui lòng thử lại sau.");
        });
    }
};
