const inputs = document.querySelectorAll(".login__input-field");
const toggle_btn = document.querySelectorAll(".login__toggle");
const main = document.querySelector("main");
const images = document.querySelectorAll(".login__image");

inputs.forEach((inp) => {
    inp.addEventListener("focus", () => {
        inp.classList.add("active");
    });
    inp.addEventListener("blur", () => {
        if (inp.value != "") return;
        inp.classList.remove("active");
    });
});

function moveSlider() {
    let index = 1;

    function transitionSlide() {
        let currentImage = document.querySelector(`.login__img-${index}`);
        images.forEach((img) => img.classList.remove("show"));
        currentImage.classList.add("show");

        index = (index % images.length) + 1;
    }

    return transitionSlide;
}

const autoSlide = moveSlider();

function startAutoSlide() {
    autoSlide();
    setTimeout(startAutoSlide, 3000); //tự động chuyển slide mỗi 3 giây
}

startAutoSlide();


document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('form');
    const phoneNumberInput = document.getElementById('phoneNumber');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');

    // Password visibility toggle
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle eye icon
            const eyeIcon = togglePassword.querySelector('.material-symbols-outlined');
            if (type === 'password') {
                eyeIcon.textContent = 'visibility';
            } else {
                eyeIcon.textContent = 'visibility_off';
            }
        });
    }

    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Clear previous errors
            document.querySelectorAll('.login__error').forEach(el => {
                el.textContent = '';
            });
            
            // Get form data
            const phoneNumber = phoneNumberInput.value.trim();
            const password = passwordInput.value.trim();
            
            // Simple validation
            let hasError = false;
            
            if (!phoneNumber) {
                document.querySelector('.login__input-wrap:nth-child(1) .login__error').textContent = 'Vui lòng nhập số điện thoại';
                hasError = true;
            }
            
            if (!password) {
                document.querySelector('.login__input-wrap:nth-child(2) .login__error').textContent = 'Vui lòng nhập mật khẩu';
                hasError = true;
            }
            
            if (hasError) {
                return;
            }
            
            // Submit form via AJAX
            fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phoneNumber, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Login successful, redirect to homepage
                    window.location.href = data.redirectUrl || '/';
                } else {
                    // Show error
                    document.querySelector('.login__input-wrap:nth-child(1) .login__error').textContent = data.message;
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                document.querySelector('.login__input-wrap:nth-child(1) .login__error').textContent = 'Đã xảy ra lỗi khi đăng nhập';
            });
        });
    }
});
