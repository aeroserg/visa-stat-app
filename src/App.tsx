import React, { useState, useEffect } from 'react';
import {
  Box,
  Input,
  Button,
  Checkbox,
  Select,
  FormControl,
  FormLabel,
  useToast,
  Heading,
  Flex,
  Container,
  useRadioGroup,
} from '@chakra-ui/react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import RadioCard from './RadioCard';

const HOST = 'https://explainagent.ru/visa_app_server/';

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
  planned_stay_in_country: string;
}

type VisaStatKeys = keyof VisaStat;

const App = () => {
  const toast = useToast();
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
    visa_status: '1',
    visa_issued_for_days: 0,
    corridor_days: 0,
    past_visas_trips: '',
    consul: '',
    planned_stay_in_country: ''
  });

  const [stats, setStats] = useState<VisaStat[]>([]);
  const [filteredStats, setFilteredStats] = useState<VisaStat[]>([]);

  const CURRENT_WIDTH = window?.innerWidth;

  useEffect(() => {
    // axios.get(`https://explainagent.ru/visa_app/api/visa-stats`).then(response => {
    axios.get(`${HOST}/api/visa-stats`).then(response => {
      setStats(response.data);
      setFilteredStats(response.data);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name.includes('date')) {
      value = value.split('-').reverse().join('.')
    }
    setForm({
      ...form,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const lastSubmission = localStorage.getItem('lastSubmission');
    if (lastSubmission && new Date().getTime() - new Date(lastSubmission).getTime() < 3600000) {
      toast({
        position: 'top',
        title: "Следующее заполнение статистики доступно через час",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    axios.post(`${HOST}/api/visa-stats`, form).then(response => {
      setStats([...stats, response.data]);
      setFilteredStats([...stats, response.data]);
      localStorage.setItem('lastSubmission', new Date().toISOString());
      toast({
        position: 'top',
        title: "Данные успешно записаны в статистику",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }).catch(error => {
      toast({
        position: 'top',
        title: "Что-то пошло не так",
        description: "Ошибка: " + JSON.stringify(error),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
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

  const filterLastSixMonths = (stats: VisaStat[]) => {
    const yearAgo = new Date();
    yearAgo.setMonth(yearAgo.getMonth() - 12);
    return stats.filter(stat => new Date(stat.visa_application_date) >= yearAgo);
  };

  const visaData = {
    labels: filterLastSixMonths(filteredStats).map(stat => stat.visa_application_date),
    datasets: [
      {
        label: 'Среднее время ожидания',
        data: filterLastSixMonths(filteredStats).map(stat => stat.waiting_days),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      }
    ]
  };

  const filters = [
    { name: 'Город', key: 'city' as VisaStatKeys },
    { name: 'Цель поездки', key: 'travel_purpose' as VisaStatKeys },
    { name: 'Дополнительный запрос документов', key: 'additional_doc_request' as VisaStatKeys, isBoolean: true },
    { name: 'Билеты выкуплены', key: 'tickets_purchased' as VisaStatKeys, isBoolean: true },
    { name: 'Отели выкуплены', key: 'hotels_purchased' as VisaStatKeys, isBoolean: true },
    { name: 'Визовый центр', key: 'visa_center' as VisaStatKeys },
    { name: 'Статус визы', key: 'visa_status' as VisaStatKeys },
  ];

  const handleDownload = async () => {
    const response = await axios.get(`${HOST}/api/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'visa_stats.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Container maxW="container.xl" p={5}>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap={3}>
          <FormControl>
            <FormLabel>Город</FormLabel>
            <Select name="city" value={form.city} onChange={handleChange}>
              <option value="Москва">Москва</option>
              <option value="Краснодар">Краснодар</option>
              <option value="Екатеринбург">Екатеринбург</option>
              <option value="Нижний Новгород">Нижний Новгород</option>
              <option value="Ростов-на-Дону">Ростов-на-Дону</option>
              <option value="Новосибирск">Новосибирск</option>
              <option value="Казань">Казань</option>
              <option value="Самара">Самара</option>
              <option value="Санкт-Петербург">Санкт-Петербург</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Дата подачи на визу</FormLabel>
            <Input name="visa_application_date" type="date" value={form.visa_application_date} onChange={handleChange} />
          </FormControl>
          <FormControl>
            <FormLabel>Дата выдачи визы</FormLabel>
            <Input name="visa_issue_date" type="date" value={form.visa_issue_date} onChange={handleChange} />
          </FormControl>
          <FormControl>
            <FormLabel>Цель поездки</FormLabel>
            <Input name="travel_purpose" value={form.travel_purpose} onChange={handleChange} />
          </FormControl>
          <FormControl>
            <FormLabel>Предполагаемая дата поездки</FormLabel>
            <Input name="planned_travel_date" type="date" value={form.planned_travel_date} onChange={handleChange} />
          </FormControl>
          <FormControl>
            <Checkbox name="additional_doc_request" isChecked={form.additional_doc_request} onChange={handleCheckboxChange}>
              Был дополнительный запрос документов?
            </Checkbox>
          </FormControl>
          <FormControl>
            <Checkbox name="tickets_purchased" isChecked={form.tickets_purchased} onChange={handleCheckboxChange}>
              Билеты выкуплены?
            </Checkbox>
          </FormControl>
          <FormControl>
            <Checkbox name="hotels_purchased" isChecked={form.hotels_purchased} onChange={handleCheckboxChange}>
              Отели выкуплены?
            </Checkbox>
          </FormControl>
          <FormControl>
            <FormLabel>Справка о типе занятости</FormLabel>
            <Input name="employment_certificate" value={form.employment_certificate} onChange={handleChange} />
          </FormControl>
          <FormControl>
            <FormLabel>Фингарантия, тыс руб</FormLabel>
            <Input name="financial_guarantee" type="number" value={form.financial_guarantee} onChange={handleChange} />
          </FormControl>
          <FormControl>
            <FormLabel>Комментарии</FormLabel>
            <Input name="comments" value={form.comments} onChange={handleChange} />
          </FormControl>
          <FormControl>
            <FormLabel>Статус визы</FormLabel>
            <Box {...getVisaStatusRootProps()}>
              <Flex gap={3}>
                <RadioCard {...getVisaStatusRadioProps({ value: '1' })}>Выдана</RadioCard>
                <RadioCard {...getVisaStatusRadioProps({ value: '0' })}>Отказ</RadioCard>
              </Flex>
            </Box>
          </FormControl>
          <FormControl>
            <FormLabel>Визовый центр</FormLabel>
            <Box {...getVisaCenterRootProps()}>
              <Flex gap={3}>
                <RadioCard {...getVisaCenterRadioProps({ value: 'VMS' })}>VMS</RadioCard>
                <RadioCard {...getVisaCenterRadioProps({ value: 'Альмавива' })}>Альмавива</RadioCard>
              </Flex>
            </Box>
          </FormControl>
          <FormControl>
            <FormLabel>Виза выдана на, дней</FormLabel>
            <Input name="visa_issued_for_days" type="number" value={form.visa_issued_for_days} onChange={handleChange} />
          </FormControl>
          <FormControl>
            <FormLabel>Коридор, дней</FormLabel>
            <Input name="corridor_days" type="number" value={form.corridor_days} onChange={handleChange} />
          </FormControl>
          <FormControl>
            <FormLabel>Прошлые визы, поездки</FormLabel>
            <Input name="past_visas_trips" value={form.past_visas_trips} onChange={handleChange} />
          </FormControl>
          <FormControl>
            <FormLabel>Консул</FormLabel>
            <Input name="consul" value={form.consul} onChange={handleChange} />
          </FormControl>
          <FormControl>
            <FormLabel>Предполагаемое время пребывания в стране</FormLabel>
            <Input name="planned_stay_in_country" value={form.planned_stay_in_country} onChange={handleChange} />
          </FormControl>
          <Button type="submit" mt={3}>Отправить</Button>
        </Flex>
      </form>
      <Box mt={10}>
        {filters.map(filter => (
          <Box key={filter.key} mb={3}>
            <Select placeholder={`Фильтр по: ${filter.name}`} onChange={(e) => handleFilterChange(filter.key, e.target.value)}>
              {[...new Set(stats.map(stat => stat[filter.key] || ''))].map((value, index) => (
                <option key={index} value={String(value)}>{String(value) || 'Пустое'}</option>
              ))}
            </Select>
          </Box>
        ))}
      </Box>
      <Heading as="h2" size="lg" mt={10}>Статистика</Heading>
      <Flex direction="column" wrap="wrap" mt={5}>
        <Box flex="1" w={['100%', '100%', '80%']} mb={5} >
          <Line data={visaData} height={`${CURRENT_WIDTH < 997 ? '300px': '150px'}`}  />
        </Box>
        <Box flex="1" w={['100%', '100%', '80%']} mb={5}>
          <Box>Среднее время ожидания: {filteredStats.length > 0 ? (filteredStats.reduce((acc, stat) => acc + stat.waiting_days, 0) / filteredStats.length).toFixed(2) : 0} дней</Box>
          <Box>Максимальное время ожидания: {filteredStats.length > 0 ? Math.max(...filteredStats.map(stat => stat.waiting_days)) : 0} дней</Box>
          <Box>Минимальное время ожидания: {filteredStats.length > 0 ? Math.min(...filteredStats.map(stat => stat.waiting_days)) : 0} дней</Box>
        </Box>
      </Flex>
      <Button onClick={handleDownload} mt={5}>Экспортировать в XLSX</Button>
    </Container>
  );
};

export default App;
