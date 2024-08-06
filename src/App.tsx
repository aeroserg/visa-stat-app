import React, { useState, useEffect } from 'react';
import {
  Box,
  Input,
  Button,
  Checkbox,
  HStack,
  Select,
  VStack,
  useRadioGroup,
  Stack
} from '@chakra-ui/react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import RadioCard from './RadioCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface VisaStat {
  id: number;
  city: string;
  visa_application_date: string;
  visa_issue_date: string;
  waiting_days: number;
  travel_purpose: string;
  planned_travel_date: string;
  additional_doc_request: boolean;
  tickets_purchased: boolean;
  hotels_purchased: boolean;
  employment_certificate: string;
  financial_guarantee: number;
  comments: string;
  visa_center: string;
  visa_status: string;
  visa_issued_for_days: number;
  corridor_days: number;
  past_visas_trips: string;
  consul: string;
  planned_stay_in_italy: string;
}

type VisaStatKeys = keyof VisaStat;

const App = () => {
  const [form, setForm] = useState({
    city: '',
    visa_application_date: '',
    visa_issue_date: '',
    travel_purpose: '',
    planned_travel_date: '',
    additional_doc_request: false,
    tickets_purchased: false,
    hotels_purchased: false,
    employment_certificate: '',
    financial_guarantee: 0,
    comments: '',
    visa_center: 'VMS',
    visa_status: 'Выдана',
    visa_issued_for_days: 0,
    corridor_days: 0,
    past_visas_trips: '',
    consul: '',
    planned_stay_in_italy: ''
  });

  const [stats, setStats] = useState<VisaStat[]>([]);
  const [filteredStats, setFilteredStats] = useState<VisaStat[]>([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/visa-stats').then(response => {
      setStats(response.data);
      setFilteredStats(response.data);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    axios.post('http://localhost:3001/api/visa-stats', form).then(response => {
      setStats([...stats, response.data]);
      setFilteredStats([...stats, response.data]);
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm({
      ...form,
      [name]: checked
    });
  };

  const handleRadioChange = (name: string, value: string) => {
    setForm({
      ...form,
      [name]: value
    });
  };

  const visaStatusGroup = useRadioGroup({
    name: 'visa_status',
    value: form.visa_status,
    onChange: (value) => handleRadioChange('visa_status', value),
  });

  const visaCenterGroup = useRadioGroup({
    name: 'visa_center',
    value: form.visa_center,
    onChange: (value) => handleRadioChange('visa_center', value),
  });

  const { getRootProps: getVisaStatusRootProps, getRadioProps: getVisaStatusRadioProps } = visaStatusGroup;
  const { getRootProps: getVisaCenterRootProps, getRadioProps: getVisaCenterRadioProps } = visaCenterGroup;

  const handleFilterChange = (key: VisaStatKeys, value: string) => {
    setFilteredStats(stats.filter(stat => {
      const statValue = stat[key];
      return statValue === value || (value === 'Пустое' && (statValue === null || statValue === undefined || statValue === ''));
    }));
  };

  const visaData = {
    labels: filteredStats.map(stat => stat.visa_application_date),
    datasets: [
      {
        label: 'Среднее время ожидания',
        data: filteredStats.map(stat => stat.waiting_days),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      }
    ]
  };

  const filters = [
    { name: 'Город', key: 'city' },
    { name: 'Цель поездки', key: 'travel_purpose' },
    { name: 'Дополнительный запрос документов', key: 'additional_doc_request', isBoolean: true },
    { name: 'Билеты выкуплены', key: 'tickets_purchased', isBoolean: true },
    { name: 'Отели выкуплены', key: 'hotels_purchased', isBoolean: true },
    { name: 'Визовый центр', key: 'visa_center' },
    { name: 'Статус визы', key: 'visa_status' },
  ];

  const handleDownload = async () => {
    const response = await axios.get('http://localhost:3001/api/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'visa_stats.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Box p={5}>
      <form onSubmit={handleSubmit}>
        <VStack spacing={3} align="stretch">
          <Input name="city" placeholder="Город" value={form.city} onChange={handleChange} />
          <Input name="visa_application_date" type="date" placeholder="Дата подачи на визу" value={form.visa_application_date} onChange={handleChange} />
          <Input name="visa_issue_date" type="date" placeholder="Дата выдачи визы" value={form.visa_issue_date} onChange={handleChange} />
          <Input name="travel_purpose" placeholder="Цель поездки" value={form.travel_purpose} onChange={handleChange} />
          <Input name="planned_travel_date" type="date" placeholder="Предполагаемая дата поездки" value={form.planned_travel_date} onChange={handleChange} />
          <Checkbox name="additional_doc_request" isChecked={form.additional_doc_request} onChange={handleCheckboxChange}>Был дополнительный запрос документов?</Checkbox>
          <Checkbox name="tickets_purchased" isChecked={form.tickets_purchased} onChange={handleCheckboxChange}>Билеты выкуплены?</Checkbox>
          <Checkbox name="hotels_purchased" isChecked={form.hotels_purchased} onChange={handleCheckboxChange}>Отели выкуплены?</Checkbox>
          <Input name="employment_certificate" placeholder="Справка о типе занятости" value={form.employment_certificate} onChange={handleChange} />
          <Input name="financial_guarantee" type="number" placeholder="Фингарантия, тыс руб" value={form.financial_guarantee} onChange={handleChange} />
          <Input name="comments" placeholder="Комментарии" value={form.comments} onChange={handleChange} />
          <Box {...getVisaStatusRootProps()}>
            <HStack spacing={3}>
              <RadioCard {...getVisaStatusRadioProps({ value: 'Выдана' })}>Выдана</RadioCard>
              <RadioCard {...getVisaStatusRadioProps({ value: 'Отказ' })}>Отказ</RadioCard>
            </HStack>
          </Box>
          <Box {...getVisaCenterRootProps()}>
            <HStack spacing={3}>
              <RadioCard {...getVisaCenterRadioProps({ value: 'VMS' })}>VMS</RadioCard>
              <RadioCard {...getVisaCenterRadioProps({ value: 'Альмавива' })}>Альмавива</RadioCard>
            </HStack>
          </Box>
          <Input name="visa_issued_for_days" type="number" placeholder="Виза выдана на, дней" value={form.visa_issued_for_days} onChange={handleChange} />
          <Input name="corridor_days" type="number" placeholder="Коридор, дней" value={form.corridor_days} onChange={handleChange} />
          <Input name="past_visas_trips" placeholder="Прошлые визы, поездки" value={form.past_visas_trips} onChange={handleChange} />
          <Input name="consul" placeholder="Консул" value={form.consul} onChange={handleChange} />
          <Input name="planned_stay_in_italy" placeholder="Предполагаемое время препровождения в Италии" value={form.planned_stay_in_italy} onChange={handleChange} />
          <Button type="submit" mt={3}>Отправить</Button>
        </VStack>
      </form>
      <Box mt={5}>
        {filters.map(filter => (
          <Box key={filter.key} mb={3}>
            <Select placeholder={`Фильтр по: ${filter.name}`} onChange={(e) => handleFilterChange(filter.key as keyof VisaStat, e.target.value)}>
              <option value="Пустое">Пустое</option>
              {[...new Set(stats.map(stat => stat[filter.key] || ''))].map(value => (
                <option key={value} value={String(value)}>{String(value)}</option>
              ))}
            </Select>
          </Box>
        ))}
      </Box>
      <Box mt={5}>
        <Line data={visaData} />
      </Box>
      <Box mt={5}>
        <Box>Среднее время ожидания: {filteredStats.length > 0 ? (filteredStats.reduce((acc, stat) => acc + stat.waiting_days, 0) / filteredStats.length).toFixed(2) : 0} дней</Box>
        <Box>Максимальное время ожидания: {filteredStats.length > 0 ? Math.max(...filteredStats.map(stat => stat.waiting_days)) : 0} дней</Box>
        <Box>Минимальное время ожидания: {filteredStats.length > 0 ? Math.min(...filteredStats.map(stat => stat.waiting_days)) : 0} дней</Box>
      </Box>
      <Button onClick={handleDownload} mt={5}>Экспортировать в XLSX</Button>
    </Box>
  );
};

export default App;
