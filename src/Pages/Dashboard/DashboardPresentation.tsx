import React from "react";
// import { useDashboard } from "@/Hooks/useDashboard";
import CustomPieChart from "@/Components/Chart/CustomPieChart";
import { useConversationChart } from "@/Hooks/Chart/useChart";
import Spinner from "@/Components/Common/Spinner";
import { MdFilterListAlt } from "react-icons/md";
import { DashboardProvider } from "@/Context/DashboardContext";
import "@/Styles/Dashboard/Dashboard.css";
import CustomBarChart from "@/Components/Chart/CustomBarChart";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Button from "@/Components/Common/Button";
import DashboardFilterModal from "@/Components/Dashboard/DashboardFilter";

const DashboardContent: React.FC = () => {
  // const { dateRange, loading: dashLoading } = useDashboard();
  // const { from, to } = dateRange;

  const {
    statusData,
    averageAssignmentTime,
    adminAvgAssignmentTime,
    loading,
    error,
    // updateDate,
    isFiterOpen,
    setIsFiterOpen,
    handleApply
  } = useConversationChart();

  const handleOpenFilterModal = () => {
    setIsFiterOpen(true);
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-header-title">Dashboard</h1>
            <p className="dashboard-header-subtitle">Resumen general de rendimiento y analisis de información.</p>
          </div>

          <section className="dashboard-filter">
            {/* <div className="dashboard-header__col">
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Filtrar Desde"
                  value={from as Date | null}
                  onChange={(d) => updateDate("from", d)}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: { className: "date-picker-field", fullWidth: true },
                  }}
                />
              </LocalizationProvider>
            </div> */}

            {/* <div className="dashboard-header__col">
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Filtrar Hasta"
                  value={from as Date | null}
                  onChange={(d) => updateDate("to", d)}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: { className: "date-picker-field", fullWidth: true },
                  }}
                />
              </LocalizationProvider>
            </div> */}
            <div className="dashboard-header-btn">
              {/* <Button onClick={handleRefresh} disabled={loading || dashLoading}>
            <MdFilterListAlt  size={14}/> Filtros
          </Button> */}

              <Button onClick={() => handleOpenFilterModal()} disabled={loading}>
                <MdFilterListAlt size={14} /> Filtros
              </Button>
            </div>
          </section>
        </header>

        {(loading) && (
          <Spinner size={40} text="Cargando datos..." />
        )}

        {/* {(error || dashError) && (
        <div className="error">
          {error ?? dashError}
        </div>
      )} */}

        {!loading && !error && (
          <section className="dashboard__chart-containers">
            <CustomPieChart
              data={statusData}
              title="Conversaciones Por Estado"
              subtitle="Porcentaje de conversaciones por estado actual."
              // subtitle={`Del ${from.toLocaleDateString()} al ${to.toLocaleDateString()}`}
            />

            <CustomBarChart
              data={averageAssignmentTime}
              title="Promedia de Aceptación"
              subtitle={`Tiempo promedio de aceptación de conversación por agente`}
            />

            <CustomBarChart
              data={adminAvgAssignmentTime}
              title="Promedio de Asignación"
              subtitle={`Tiempo promedio de asignación manual de un gente por administradora.`}
            />

          </section>
        )}
      </div>

        <DashboardFilterModal
          onClosed={() => setIsFiterOpen(false)} isFilterOpen={isFiterOpen} handleApply={handleApply}/>
    </div>
  );
};

const DashboardPresentation: React.FC = () => {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
};

export default DashboardPresentation;