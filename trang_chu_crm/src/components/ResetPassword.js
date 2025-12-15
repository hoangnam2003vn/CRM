import React, { useState } from 'react';

function ResetPassword() {
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Xử lý thay đổi trong các trường nhập liệu
  const handleVerificationCodeChange = (e) => {
    setVerificationCode(e.target.value);
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  // Kiểm tra các trường nhập liệu khi nhấn nút Xác nhận
  const handleSubmit = (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp. Vui lòng thử lại.');
      return;
    }

    if (newPassword === '') {
      setErrorMessage('Mật khẩu mới không được để trống.');
      return;
    }

    if (verificationCode === '') {
      setErrorMessage('Mã xác minh không được để trống.');
      return;
    }

    setErrorMessage('');
    alert('Mật khẩu đã được thay đổi thành công!');
    // Đây là nơi bạn có thể thêm logic gọi API để thay đổi mật khẩu
  };

  return (
    <div className="reset-password-container">
      <h2>Khôi phục mật khẩu</h2>
      <form onSubmit={handleSubmit} className="reset-password-form">
        <div className="input-group">
          <label htmlFor="verification-code">Mã xác minh:</label>
          <input
            type="text"
            id="verification-code"
            value={verificationCode}
            onChange={handleVerificationCodeChange}
            placeholder="Nhập mã xác minh"
          />
        </div>

        <div className="input-group">
          <label htmlFor="new-password">Mật khẩu mới:</label>
          <input
            type="password"
            id="new-password"
            value={newPassword}
            onChange={handleNewPasswordChange}
            placeholder="Nhập mật khẩu mới"
          />
        </div>

        <div className="input-group">
          <label htmlFor="confirm-password">Xác nhận mật khẩu mới:</label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>

        {errorMessage && <div className="error-message">{errorMessage}</div>}

        <button type="submit">Xác nhận</button>
      </form>
    </div>
  );
}

export default ResetPassword;
