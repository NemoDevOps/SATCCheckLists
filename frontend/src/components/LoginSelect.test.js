// Разработчик Багиров Артем - artem.bagirov777@gmail.com
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginSelect from './LoginSelect';
import * as api from '../api';

// Мокаем API-вызовы
jest.mock('../api');

const mockUsers = [
  { id: 1, name: 'РПА-1' },
  { id: 2, name: 'Ст.ДПА-2' },
  { id: 3, name: 'РПР-3' },
  { id: 4, name: 'Ст.РЦ-4' },
  { id: 5, name: 'Другой-5' },
];

describe('LoginSelect Component', () => {
  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    api.fetchUsers.mockResolvedValue(mockUsers);
    api.login.mockResolvedValue({});
    api.voiceLogin.mockResolvedValue(mockUsers[0]);
  });

  test('рендерится без ошибок и загружает пользователей', async () => {
    render(<LoginSelect onLogin={() => {}} />);
    
    // Проверяем заголовок
    expect(screen.getByText('🔑 Вход')).toBeInTheDocument();
    
    // Ждем, пока пользователи загрузятся и появятся в списке
    await waitFor(() => {
      expect(screen.getByText('РПА-1')).toBeInTheDocument();
      expect(screen.getByText('Другой-5')).toBeInTheDocument();
    });
  });

  test('фильтрует пользователей по категории "Вышка"', async () => {
    render(<LoginSelect onLogin={() => {}} />);
    
    await waitFor(() => expect(api.fetchUsers).toHaveBeenCalledTimes(1));

    // Кликаем на фильтр "Вышка"
    fireEvent.click(screen.getByText('Вышка'));

    // Проверяем, что остались только нужные пользователи
    expect(screen.getByText('РПА-1')).toBeInTheDocument();
    expect(screen.getByText('Ст.ДПА-2')).toBeInTheDocument();
    expect(screen.queryByText('РПР-3')).not.toBeInTheDocument();
    expect(screen.queryByText('Другой-5')).not.toBeInTheDocument();
  });

  test('фильтрует пользователей по категории "Зал"', async () => {
    render(<LoginSelect onLogin={() => {}} />);
    
    await waitFor(() => expect(api.fetchUsers).toHaveBeenCalledTimes(1));

    // Кликаем на фильтр "Зал"
    fireEvent.click(screen.getByText('Зал'));

    // Проверяем, что остались только нужные пользователи
    expect(screen.getByText('РПР-3')).toBeInTheDocument();
    expect(screen.getByText('Ст.РЦ-4')).toBeInTheDocument();
    expect(screen.queryByText('РПА-1')).not.toBeInTheDocument();
  });

  test('позволяет выбрать пользователя и ввести пароль', async () => {
    render(<LoginSelect onLogin={() => {}} />);
    await waitFor(() => expect(api.fetchUsers).toHaveBeenCalledTimes(1));

    // Выбираем пользователя
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    
    // Вводим пароль
    const passwordInput = screen.getByPlaceholderText('Пароль (4 цифры)');
    fireEvent.change(passwordInput, { target: { value: '1234' } });

    expect(passwordInput.value).toBe('1234');
    expect(screen.getByRole('combobox').value).toBe('1');
  });

  test('вызывает onLogin при успешном входе', async () => {
    const handleLoginMock = jest.fn();
    render(<LoginSelect onLogin={handleLoginMock} />);
    await waitFor(() => expect(api.fetchUsers).toHaveBeenCalledTimes(1));

    // Выбираем пользователя и вводим пароль
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('Пароль (4 цифры)'), { target: { value: '1111' } });

    // Кликаем "Войти"
    fireEvent.click(screen.getByText('Войти'));

    // Проверяем, что был вызван API-метод login и колбэк onLogin
    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith(1, '1111');
      expect(handleLoginMock).toHaveBeenCalledWith(mockUsers[0]);
    });
  });
});
