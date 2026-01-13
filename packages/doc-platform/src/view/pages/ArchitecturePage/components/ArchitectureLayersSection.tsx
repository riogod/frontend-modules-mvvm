import { type FC } from 'react';
import { DocSection, DocList } from '../../../common';

export const ArchitectureLayersSection: FC = () => (
  <DocSection title="Слои архитектуры">
    <p>Архитектура состоит из пяти основных слоев:</p>
    <DocList
      items={[
        {
          content: 'Model — хранение состояния',
          children: [
            'Только состояние без бизнес-логики',
            'MobX makeAutoObservable',
            'Singleton в DI',
          ],
        },
        {
          content: 'ViewModel — прокси к Model',
          children: [
            'Геттеры возвращают данные из Model',
            'Методы делегируют в Use Cases',
            'Не хранит данные',
          ],
        },
        {
          content: 'View — React компоненты',
          children: [
            'observer() для реактивности',
            'useVM() для получения ViewModel',
            'Только отображение',
          ],
        },
        {
          content: 'Use Cases — бизнес-логика',
          children: [
            'Один Use Case = одна операция',
            'Валидация входных данных',
            'execute() метод',
          ],
        },
        {
          content: 'Repository — работа с данными',
          children: [
            'API запросы через APIClient',
            'Zod валидация',
            'DTO → Entity маппинг',
          ],
        },
      ]}
    />
  </DocSection>
);
