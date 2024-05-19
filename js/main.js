$(document).ready(function() {
    get();
    setInterval(
        function() {
            get();
        }, 1000
    );
    $("#add").click(function() {
        document.getElementById("addDialog").showModal();
    });
    $("#cancel").click(function() {
        closeDialog();
    });
    $("#addForm").submit(function(event) {
        const name = $("#name").val();
        const secret = $("#secret").val();
        if (name === "" || secret === "") {
            alert("名称和密钥不能为空");
            return;
        }
        try {
            const totp = new jsOTP.Totp();
            totp.getOtp(secret);
        }catch(e){
            alert("密钥格式错误");
            return;
        }
        console.log(name + " " + secret);
        add(secret, name);
        closeDialog();
        event.preventDefault();
    });
    $("#add_qrcode").click(function() {
        document.getElementById("addQrcode").showModal();
    });
    $("#cancel2").click(function() {
        closeDialog2();
    });
    const fileInput = document.getElementById("file");
    $("#addQrcodeForm").submit(function(event) {
        event.preventDefault();
        //扫描二维码
        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function() {
            const blobURL = URL.createObjectURL(file);
            console.log(blobURL);
            scanQRCode(blobURL, function(result) {
                if (result === "undefined") {
                    return;
                }
                try{
                    const totp = new jsOTP.Totp();
                    totp.getOtp(result);
                }catch(e){
                }
                // 创建URL对象
                const otpUrl = new URL(result);

// 获取URL参数
                const params = new URLSearchParams(otpUrl.search);

// 获取secret和issuer的值
                const secret = params.get("secret");
                const issuer = params.get("issuer");
                const account = parseOTPAuthURL(result).account;
                console.log(secret + " " + issuer + " - " + account);
                add(secret, issuer + " - " + account);
            });
            closeDialog2();
        };

        reader.readAsDataURL(file);
    });
});

function closeDialog() {
    document.getElementById("addDialog").close();
}
function closeDialog2() {
    document.getElementById("addQrcode").close();
}
function add(secret, name) {
    //先读取session
    // for (let i = 0; true; i++) {
    //     if (sessionStorage.getItem(i + 1) === null){
    //         const x = {
    //             "id": i + 1,
    //             "name": name,
    //             "secret": secret
    //         };
    //         sessionStorage.setItem(i + 1, JSON.stringify(x));
    //         break;
    //     }
    // }
    const x = {
        "id": sessionStorage.length + 1,
        "name": name,
        "secret": secret
    };
     sessionStorage.setItem(sessionStorage.length + 1, JSON.stringify(x));
}
function get() {
    let add_html = "";
    for (let i = 1; i <= sessionStorage.length; i++) {
        if (sessionStorage.getItem(i) === null) {
            continue;
        }
        const x = JSON.parse(sessionStorage.getItem(i));
        //获取时间
        // 计算剩余时间（以毫秒为单位）
        let time_end = getExpireTime();
        // 计算剩余时间（以秒为单位）
        const remainingSeconds = 30 - (time_end - Math.floor(new Date().getTime() / 1000));
        //获取时间验证码
        const totp = new jsOTP.Totp();
        const timeCode = totp.getOtp(x.secret);
        //转换成html
        const html = `
            <tr>
                <td>${x.id}</td>
                <td>${x.secret}</td>
                <td>${x.name}</td>
                <td><div id="${x.id}_timeCode">${timeCode}</div></td>
                <td>${remainingSeconds}</td>
                <td><button class="btn btn-danger" onclick="_delete(${x.id})">删除</button><button class="btn btn-success btn_copy" style="margin-left: 10px;" id="${x.id}_copy" onclick="_copy(${timeCode})">复制验证码</button></td>
            </tr>
        `;
        add_html += html;
    }
    $("#tbody").html(add_html);
}

const image = document.getElementById('image');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const qrCode = new Image();
function scanQRCode(blobUrl,callback) {
    image.src = blobUrl;
    qrCode.onload = function() {
        canvas.width = qrCode.width;
        canvas.height = qrCode.height;
        ctx.drawImage(qrCode, 0, 0, qrCode.width, qrCode.height);
        const imageData = ctx.getImageData(0, 0, qrCode.width, qrCode.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
            console.log(code.data);
            callback(code.data);
        } else {
            alert('未找到二维码');
            callback("undefined");
        }
    };

    qrCode.src = image.src;
}
function _delete(id) {
    sessionStorage.removeItem(id);
    location.reload();
}
function _deleteAll() {
    sessionStorage.clear();
    location.reload();
}
//计算过期时间
function getExpireTime(date = new Date()) {
    //先转换成秒
    const time = Math.floor(date.getTime() / 1000);
    // 计算过期时间
    const expireTime = Math.floor(time % 30); // 30秒后过期
    return expireTime + time;
}
function _copy(data) {
    const input = document.createElement('input');
    input.value = data;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    alert('复制成功');
}
function parseOTPAuthURL(url) {
    const regex = /^otpauth:\/\/totp\/([^?]+)\?secret=([^&]+)&issuer=([^&]+)/;
    const match = url.match(regex);

    if (match) {
        const [, account, secret, issuer] = match;
        return {
            account: decodeURIComponent(account),
            secret: decodeURIComponent(secret),
            issuer: decodeURIComponent(issuer)
        };
    }

    return null;
}
