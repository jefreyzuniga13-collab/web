import React from 'react'
import { useDashboard } from '@/Hooks/useDashboard'
import CustomPieChart from '@/Components/Chart/CustomPieChart'
import { useConversationChart } from '@/Hooks/Chart/useChart'
import Spinner from '@/Components/Common/Spinner'
import { RefreshCw } from 'lucide-react'
import { DashboardProvider } from '@/Context/DashboardContext'
import DashboardMenu from '@/Components/Dashboard/DashboardMenu'
import '@/Styles/Dashboard/Dashboard.css'
import CustomBarChart from '@/Components/Chart/CustomBarChart'

const DashboardContent: React.FC = () => {
  const { dateRange, loading: dashLoading, setDateRange, error: dashError, refreshData } = useDashboard()
  const { from, to } = dateRange

  const { data, AverageAssignmentTime, loading, error, refresh } = useConversationChart(from, to)

  const handleDateChange = (newFrom: Date, newTo: Date) => {
    setDateRange(newFrom, newTo)
  }

  const handleRefresh = () => {
    refreshData()    // refresca todos los KPIs
    refresh()       // refresca sólo el chart de conversaciones
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleRefresh} disabled={loading || dashLoading}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </header>

      {(loading || dashLoading) && (
        <Spinner size={40} text="Cargando datos..." />
      )}

      {(error || dashError) && (
        <div className="error">
          {error ?? dashError}
        </div>
      )}

      {!loading && !error && (
       <>
         <CustomPieChart
          data={data}
          title="Conversaciones Por Estado"
          subtitle={`Del ${from.toLocaleDateString()} al ${to.toLocaleDateString()}`}
        />

        <CustomBarChart
          data={AverageAssignmentTime}
          title="Promedia de Aceptación"
          subtitle={`Tiempo promedio de aceptación de conversación por agente`}
        />
       </>
      )}

      <DashboardMenu
        from={from}
        to={to}
        onDateChange={handleDateChange}
        onRefresh={handleRefresh}
      />
    </div>
  )
}


const DashboardPresentation: React.FC = () => {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
};


export default DashboardPresentation;