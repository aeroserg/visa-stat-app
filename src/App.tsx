import React, { useState, useEffect } from "react";
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
  Text,
  Radio,
  RadioGroup,
  Stack,
  Link,
} from "@chakra-ui/react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  TimeScale,
  ChartOptions,
} from "chart.js";
import "chartjs-adapter-moment";
import RadioCard from "./RadioCard";

// const HOST = "http://localhost:3001";
const HOST = "https://explainagent.ru/visa_app_server";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

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
  financial_guarantee: number | undefined;
  comments: string;
  visa_center: string;
  visa_status: string;
  visa_issued_for_days: number | undefined;
  corridor_days: number | undefined;
  past_visas_trips: string;
  consul: string;
  planned_stay_in_country: string;
}

type VisaStatKeys = keyof VisaStat;

const App = () => {
  const toast = useToast();
  const [form, setForm] = useState({
    city: "Москва",
    visa_application_date: "",
    visa_issue_date: "",
    travel_purpose: "",
    planned_travel_date: "",
    additional_doc_request: false,
    tickets_purchased: false,
    hotels_purchased: false,
    employment_certificate: "",
    financial_guarantee: undefined,
    comments: "",
    visa_center: "VMS",
    visa_status: "1",
    visa_issued_for_days: undefined,
    corridor_days: undefined,
    past_visas_trips: "",
    consul: "",
    planned_stay_in_country: "",
  });

  const [stats, setStats] = useState<VisaStat[]>([]);
  const [filteredStats, setFilteredStats] = useState<VisaStat[]>([]);
  const [showChart, setShowChart] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedVisaCenter, setSelectedVisaCenter] = useState<string>("");
  const [lastTenVisasPeriods, setLastTenVisasPeriods] = useState<number[]>([]);
  const [averageWaitingTime, setAverageWaitingTime] = useState<number>(0);
  const [maxWaitingTime, setMaxWaitingTime] = useState<number>(0);
  const [minWaitingTime, setMinWaitingTime] = useState<number>(0);

  const CURRENT_WIDTH = window?.innerWidth;

  useEffect(() => {
    axios.get(`${HOST}/api/visa-stats`).then((response) => {
      setStats(response.data);
      setFilteredStats(response.data);
      updateStatistics(response.data);
    });
    // Check browser and OS
    const userAgent = window.navigator.userAgent;
    const isApple =
      window.navigator.vendor.includes("Apple") ||
      userAgent.includes("(Iphone");
    const isWindows = userAgent.includes("(Windows");
    const isFireFox = userAgent.includes("Firefox/");
    const isGoogle = window.navigator.vendor.includes("Google");
    if (isGoogle || (!isFireFox && (!isApple || isWindows))) {
      setShowChart(true);
    }
  }, []);

  useEffect(() => {
    updateStatistics(filteredStats);
  }, [filteredStats]);

  const updateStatistics = (stats: VisaStat[]) => {
    const lastTen = stats.slice(-10).map((stat) => stat.waiting_days);
    setLastTenVisasPeriods(lastTen);

    if (stats.length > 0) {
      const average =
        stats.reduce((acc, stat) => acc + stat.waiting_days, 0) / stats.length;
      const max = Math.max(...stats.map((stat) => stat.waiting_days));
      const min = Math.min(...stats.map((stat) => stat.waiting_days));

      setAverageWaitingTime(average);
      setMaxWaitingTime(max);
      setMinWaitingTime(min);
    } else {
      setAverageWaitingTime(0);
      setMaxWaitingTime(0);
      setMinWaitingTime(0);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleFilterChange = (key: VisaStatKeys, value: string) => {
    let city = selectedCity;
    let visaCenter = selectedVisaCenter;

    if (key === "city") {
      city = value;
      setSelectedCity(value);
    } else if (key === "visa_center") {
      visaCenter = value;
      setSelectedVisaCenter(value);
    }

    filterStats(city, visaCenter, periodFilter);
  };

  const handlePeriodFilterChange = (value: string) => {
    setPeriodFilter(value);
    filterStats(selectedCity, selectedVisaCenter, value);
  };

  const filterStats = (city: string, visaCenter: string, period: string) => {
    let filtered = stats;

    if (city) {
      filtered = filtered.filter((stat) => stat.city === city);
    }

    if (visaCenter) {
      filtered = filtered.filter((stat) => stat.visa_center === visaCenter);
    }

    const currentDate = new Date();
    if (period === "6months") {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
      filtered = filtered.filter((stat) => {
        const issueDate = new Date(
          stat.visa_issue_date.split(".").reverse().join("-")
        );
        return issueDate >= sixMonthsAgo;
      });
    } else if (period === "1month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(currentDate.getMonth() - 1);
      filtered = filtered.filter((stat) => {
        const issueDate = new Date(
          stat.visa_issue_date.split(".").reverse().join("-")
        );
        return issueDate >= oneMonthAgo;
      });
    }

    setFilteredStats(filtered);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const updatedForm = JSON.parse(JSON.stringify(form));

    for (const key in updatedForm) {
      if (key.includes("date") && updatedForm[key as keyof typeof form]) {
        updatedForm[key as keyof typeof form] = (
          updatedForm[key as keyof typeof form] as string
        )
          .split("-")
          .reverse()
          .join(".");
        console.log(key + ' ' + updatedForm[key as keyof typeof form])
      }
    }   

    setForm(updatedForm);

    const lastSubmission = localStorage.getItem("lastSubmission");
    if (
      lastSubmission &&
      new Date().getTime() - new Date(lastSubmission).getTime() < 3600000
    ) {
      toast({
        position: "top",
        title: "Следующее заполнение статистики доступно через час",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    axios
      .post(`${HOST}/api/visa-stats`, updatedForm)
      .then((response) => {
        const updatedStats = [...stats, response.data];
        setStats(updatedStats);
        setFilteredStats(updatedStats);
        localStorage.setItem("lastSubmission", new Date().toISOString());
        toast({
          position: "top",
          title: "Спасибо большое за ваш вклад! ",
          description:
            "Данные успешно записаны в статистику. Вы также можете скачать полную статистику внизу.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .catch((error) => {
        toast({
          position: "top",
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
      [name]: checked,
    });
  };

  const handleRadioChange = (name: string, value: string) => {
    setForm({
      ...form,
      [name]: value,
    });
  };

  const visaStatusGroup = useRadioGroup({
    name: "visa_status",
    value: form.visa_status,
    onChange: (value) => handleRadioChange("visa_status", value),
  });

  const visaCenterGroup = useRadioGroup({
    name: "visa_center",
    value: form.visa_center,
    onChange: (value) => handleRadioChange("visa_center", value),
  });

  const {
    getRootProps: getVisaStatusRootProps,
    getRadioProps: getVisaStatusRadioProps,
  } = visaStatusGroup;
  const {
    getRootProps: getVisaCenterRootProps,
    getRadioProps: getVisaCenterRadioProps,
  } = visaCenterGroup;

  const groupByDateAndCalculateAverage = (data: VisaStat[]) => {
    const groupedData: {
      [key: string]: { totalWaitingDays: number; count: number };
    } = {};

    data.forEach((stat) => {
      const date = stat.visa_application_date?.split(".").reverse().join("-");
      if (!groupedData[date]) {
        groupedData[date] = { totalWaitingDays: 0, count: 0 };
      }
      groupedData[date].totalWaitingDays += stat.waiting_days;
      groupedData[date].count += 1;
    });

    return Object.keys(groupedData)
      .map((date) => ({
        date,
        averageWaitingDays:
          groupedData[date].totalWaitingDays / groupedData[date].count,
      }))
      .sort(
        (a, b) =>
          new Date(a.date.split(".").reverse().join("-")).getTime() -
          new Date(b.date.split(".").reverse().join("-")).getTime()
      );
  };

  const groupedAndSortedData = groupByDateAndCalculateAverage(filteredStats);

  const visaData: ChartData<"line", number[], string> = {
    labels: groupedAndSortedData.map((entry) => entry.date),
    datasets: [
      {
        label: "Среднее время ожидания",
        data: groupedAndSortedData.map((entry) => entry.averageWaitingDays),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        cubicInterpolationMode: "monotone",
        tension: 0.4,
      },
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1,
    },
    scales: {
      x: {
        time: {
          unit: "month",
        },
        title: {
          display: true,
          text: "Дата подачи на визу",
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
      y: {
        title: {
          display: true,
          text: "Время ожидания (дней)",
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
    },
    onResize: (chart: ChartJS) => {
      chart.update();
    },
  };

  const filters = [
    { name: "Город", key: "city" as VisaStatKeys },
    { name: "Визовый центр", key: "visa_center" as VisaStatKeys },
    // { name: "Статус визы", key: "visa_status" as VisaStatKeys },
  ];

  const handleDownload = () => {
    const url = `${HOST}/api/export`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `visa_statistics_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Container maxW="container.xl" p={5}>
    <Heading as={'h1'} mb={3}>Здесь можно записать свой опыт подачи на итальянскую визу</Heading>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap={3}>
          <FormControl>
            <FormLabel>Город</FormLabel>
            <Select
              required
              name="city"
              value={form.city}
              onChange={handleChange}
            >
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
            <Input
              required
              name="visa_application_date"
              type="date"
              value={form.visa_application_date}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Дата выдачи визы</FormLabel>
            <Input
              required
              name="visa_issue_date"
              type="date"
              value={form.visa_issue_date}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Цель поездки</FormLabel>
            <Input
              name="travel_purpose"
              value={form.travel_purpose}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Предполагаемая дата поездки</FormLabel>
            <Input
              name="planned_travel_date"
              type="date"
              value={form.planned_travel_date}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl>
            <Checkbox
              name="additional_doc_request"
              isChecked={form.additional_doc_request}
              onChange={handleCheckboxChange}
            >
              Был дополнительный запрос документов?
            </Checkbox>
          </FormControl>
          <FormControl>
            <Checkbox
              name="tickets_purchased"
              isChecked={form.tickets_purchased}
              onChange={handleCheckboxChange}
            >
              Билеты выкуплены?
            </Checkbox>
          </FormControl>
          <FormControl>
            <Checkbox
              name="hotels_purchased"
              isChecked={form.hotels_purchased}
              onChange={handleCheckboxChange}
            >
              Отели выкуплены?
            </Checkbox>
          </FormControl>
          <FormControl>
            <FormLabel>Справка о типе занятости</FormLabel>
            <Input
              name="employment_certificate"
              value={form.employment_certificate}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Фингарантия, тыс руб</FormLabel>
            <Input
              name="financial_guarantee"
              type="number"
              value={form.financial_guarantee}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Комментарии</FormLabel>
            <Input
              name="comments"
              value={form.comments}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Статус визы</FormLabel>
            <Box {...getVisaStatusRootProps()}>
              <Flex gap={3}>
                <RadioCard {...getVisaStatusRadioProps({ value: "1" })}>
                  Выдана
                </RadioCard>
                <RadioCard {...getVisaStatusRadioProps({ value: "0" })}>
                  Отказ
                </RadioCard>
              </Flex>
            </Box>
          </FormControl>
          <FormControl>
            <FormLabel>Визовый центр</FormLabel>
            <Box {...getVisaCenterRootProps()}>
              <Flex gap={3}>
                <RadioCard {...getVisaCenterRadioProps({ value: "VMS" })}>
                  VMS
                </RadioCard>
                <RadioCard {...getVisaCenterRadioProps({ value: "Альмавива" })}>
                  Альмавива
                </RadioCard>
              </Flex>
            </Box>
          </FormControl>
          <FormControl>
            <FormLabel>Виза выдана на, дней</FormLabel>
            <Input
              name="visa_issued_for_days"
              type="number"
              value={form.visa_issued_for_days}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Коридор, дней</FormLabel>
            <Input
              name="corridor_days"
              type="number"
              value={form.corridor_days}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Прошлые визы, поездки</FormLabel>
            <Input
              name="past_visas_trips"
              value={form.past_visas_trips}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Консул</FormLabel>
            <Input name="consul" value={form.consul} onChange={handleChange} />
          </FormControl>
          <FormControl>
            <FormLabel>Предполагаемое время пребывания в стране</FormLabel>
            <Input
              name="planned_stay_in_country"
              value={form.planned_stay_in_country}
              onChange={handleChange}
            />
          </FormControl>
          <Button type="submit" mt={3}>
            Отправить
          </Button>
        </Flex>
      </form>
      <Heading as={'h2'} my={3} py={5}><Link href="https://explainagent.ru/visa_app/" target="_blank" color={'#000000'} fontWeight={'900'}>https://explainagent.ru/visa_app/</Link></Heading>

      <Box mt={3}>
        <Heading as="h3" size="md" mt={6}>
          Фильтр по периоду:
        </Heading>
        <RadioGroup onChange={handlePeriodFilterChange} value={periodFilter}>
          <Stack direction="row">
            <Radio value="all">Всё время</Radio>
            <Radio value="6months">Последние 6 месяцев</Radio>
            <Radio value="1month">Последний месяц</Radio>
          </Stack>
        </RadioGroup>

        <Flex mt={10} flexDir={{ base: "column", md: "row" }}>
          {filters.map((filter) => (
            <Box key={filter.key} m={3} w={{ base: "100%", md: "25%" }}>
              <FormLabel>{`Фильтр по: ${filter.name}`}</FormLabel>
              <Select
                placeholder={`Все`}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              >
                {[...new Set(stats.map((stat) => stat[filter.key] || ""))].map(
                  (value, index) => (
                    <option key={index} value={String(value)}>
                      {String(value) || "Пустое"}
                    </option>
                  )
                )}
              </Select>
            </Box>
          ))}
        </Flex>

        <Heading as="h2" size="lg" mt={10}>
          Статистика
        </Heading>
        <Text>
          Внимание! Статистика и графики ориентировочные! Необходимо понимать,
          что в данную форму добавить запись может любой человек. Данные в
          графике и в файле, который можно скачать ниже, примерные и не точные.
        </Text>
        <Flex direction="column" wrap="wrap" mt={5}>
          {showChart ? (
            <Box flex="1" w={["100%", "100%", "80%"]} mb={5}>
              <Line
                redraw={true}
                data={visaData}
                height={CURRENT_WIDTH < 997 ? 300 : 800}
                options={chartOptions}
              />
            </Box>
          ) : (
            <Box
              border="2px solid #000000"
              borderRadius="1rem"
              backgroundColor="#00000011"
              m={4}
              p={5}
            >
              К сожалению, не можем вам показать графики, так как вашe
              устройство их не поддерживает. Но вы можете либо открыть сайт из
              Google Chrome, либо скачать статистику по кнопке внизу и построить
              любой график!
            </Box>
          )}
          <Box flex="1" w={["100%", "100%", "100%"]} mb={5}>
            <Box>
              Среднее время ожидания: {averageWaitingTime.toFixed(2)} дней
            </Box>
            <Box>Максимальное время ожидания: {maxWaitingTime} дней</Box>
            <Box>Минимальное время ожидания: {minWaitingTime} дней</Box>
            <Box>
              Последние 10 человек ждали: {lastTenVisasPeriods.join(", ")} дней,
              прежде чем получили визы.
            </Box>
          </Box>
        </Flex>
      </Box>

      <Button onClick={handleDownload} mt={5}>
        Экспортировать в XLSX
      </Button>
    </Container>
  );
};

export default App;
