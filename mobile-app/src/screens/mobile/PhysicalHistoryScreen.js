import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import apiService from '../../services/api/api.service';

const screenWidth = Dimensions.get('window').width;

export default function PhysicalHistoryScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('peso');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/physical-profiles');
      
      if (response.data && response.data.length > 0) {
        // Ordenar por fecha descendente
        const sortedProfiles = response.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setProfiles(sortedProfiles);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      Alert.alert('Error', 'No se pudo cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (profiles.length === 0) return null;

    // Tomar los últimos 10 registros o menos
    const recentProfiles = profiles.slice(0, 10).reverse();

    const labels = recentProfiles.map(p => 
      new Date(p.createdAt).toLocaleDateString('es-MX', { 
        day: 'numeric', 
        month: 'short' 
      })
    );

    let data = [];
    let suffix = '';

    switch (selectedMetric) {
      case 'peso':
        data = recentProfiles.map(p => p.peso || 0);
        suffix = 'kg';
        break;
      case 'imc':
        data = recentProfiles.map(p => p.imc || 0);
        suffix = '';
        break;
      case 'grasa':
        data = recentProfiles.map(p => p.porcentajeGrasa || 0);
        suffix = '%';
        break;
      case 'musculo':
        data = recentProfiles.map(p => p.masaMuscular || 0);
        suffix = 'kg';
        break;
      default:
        data = recentProfiles.map(p => p.peso || 0);
        suffix = 'kg';
    }

    // Filtrar datos válidos
    const validData = data.filter(d => d > 0);
    if (validData.length === 0) return null;

    return {
      labels,
      datasets: [{ data }],
      suffix
    };
  };

  const getDifference = () => {
    if (profiles.length < 2) return null;

    const latest = profiles[0];
    const previous = profiles[1];

    let current, prev, unit;

    switch (selectedMetric) {
      case 'peso':
        current = latest.peso;
        prev = previous.peso;
        unit = 'kg';
        break;
      case 'imc':
        current = latest.imc;
        prev = previous.imc;
        unit = '';
        break;
      case 'grasa':
        current = latest.porcentajeGrasa;
        prev = previous.porcentajeGrasa;
        unit = '%';
        break;
      case 'musculo':
        current = latest.masaMuscular;
        prev = previous.masaMuscular;
        unit = 'kg';
        break;
      default:
        return null;
    }

    if (!current || !prev) return null;

    const diff = current - prev;
    const isPositive = diff > 0;

    return {
      value: Math.abs(diff).toFixed(1),
      isPositive,
      unit
    };
  };

  const metrics = [
    { key: 'peso', label: 'Peso', icon: 'fitness' },
    { key: 'imc', label: 'IMC', icon: 'analytics' },
    { key: 'grasa', label: '% Grasa', icon: 'water' },
    { key: 'musculo', label: 'Músculo', icon: 'barbell' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (profiles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bar-chart-outline" size={64} color="#CCC" />
        <Text style={styles.emptyText}>No hay historial disponible</Text>
        <Text style={styles.emptySubtext}>Registra tu perfil físico para comenzar</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('PhysicalProfile')}
        >
          <Text style={styles.createButtonText}>Crear Perfil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const chartData = getChartData();
  const difference = getDifference();

  return (
    <ScrollView style={styles.container}>
      {/* Selector de Métricas */}
      <View style={styles.metricsContainer}>
        {metrics.map(metric => (
          <TouchableOpacity
            key={metric.key}
            style={[
              styles.metricButton,
              selectedMetric === metric.key && styles.metricButtonActive
            ]}
            onPress={() => setSelectedMetric(metric.key)}
          >
            <Ionicons 
              name={metric.icon} 
              size={20} 
              color={selectedMetric === metric.key ? '#FFF' : '#007AFF'} 
            />
            <Text style={[
              styles.metricButtonText,
              selectedMetric === metric.key && styles.metricButtonTextActive
            ]}>
              {metric.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Diferencia con última medición */}
      {difference && (
        <View style={styles.differenceCard}>
          <View style={styles.differenceContent}>
            <Ionicons 
              name={difference.isPositive ? 'trending-up' : 'trending-down'} 
              size={24} 
              color={difference.isPositive ? '#EF5350' : '#66BB6A'} 
            />
            <Text style={[
              styles.differenceValue,
              { color: difference.isPositive ? '#EF5350' : '#66BB6A' }
            ]}>
              {difference.isPositive ? '+' : '-'}{difference.value} {difference.unit}
            </Text>
          </View>
          <Text style={styles.differenceText}>vs. medición anterior</Text>
        </View>
      )}

      {/* Gráfica */}
      {chartData && chartData.datasets[0].data.some(d => d > 0) ? (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Evolución de {metrics.find(m => m.key === selectedMetric)?.label}</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#FFF',
              backgroundGradientFrom: '#FFF',
              backgroundGradientTo: '#FFF',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#007AFF',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      ) : (
        <View style={styles.noDataCard}>
          <Ionicons name="information-circle-outline" size={32} color="#FFA726" />
          <Text style={styles.noDataText}>No hay datos suficientes para esta métrica</Text>
        </View>
      )}

      {/* Lista de Registros */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Historial de Mediciones</Text>
        {profiles.map((profile, index) => (
          <View key={profile.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View style={styles.historyDate}>
                <Ionicons name="calendar" size={16} color="#007AFF" />
                <Text style={styles.historyDateText}>
                  {new Date(profile.createdAt).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
              {index === 0 && (
                <View style={styles.latestBadge}>
                  <Text style={styles.latestBadgeText}>Más reciente</Text>
                </View>
              )}
            </View>

            <View style={styles.historyData}>
              <View style={styles.historyDataItem}>
                <Text style={styles.historyDataLabel}>Peso</Text>
                <Text style={styles.historyDataValue}>{profile.peso} kg</Text>
              </View>

              <View style={styles.historyDataItem}>
                <Text style={styles.historyDataLabel}>IMC</Text>
                <Text style={styles.historyDataValue}>
                  {profile.imc ? profile.imc.toFixed(1) : '--'}
                </Text>
              </View>

              {profile.porcentajeGrasa && (
                <View style={styles.historyDataItem}>
                  <Text style={styles.historyDataLabel}>% Grasa</Text>
                  <Text style={styles.historyDataValue}>{profile.porcentajeGrasa}%</Text>
                </View>
              )}

              {profile.masaMuscular && (
                <View style={styles.historyDataItem}>
                  <Text style={styles.historyDataLabel}>Músculo</Text>
                  <Text style={styles.historyDataValue}>{profile.masaMuscular} kg</Text>
                </View>
              )}
            </View>

            {/* Mostrar mediciones si existen */}
            {(profile.brazo || profile.pecho || profile.cintura || profile.cadera || profile.muslo) && (
              <View style={styles.measurementsContainer}>
                <Text style={styles.measurementsTitle}>Circunferencias:</Text>
                <View style={styles.measurementsGrid}>
                  {profile.brazo && (
                    <Text style={styles.measurementText}>Brazo: {profile.brazo} cm</Text>
                  )}
                  {profile.pecho && (
                    <Text style={styles.measurementText}>Pecho: {profile.pecho} cm</Text>
                  )}
                  {profile.cintura && (
                    <Text style={styles.measurementText}>Cintura: {profile.cintura} cm</Text>
                  )}
                  {profile.cadera && (
                    <Text style={styles.measurementText}>Cadera: {profile.cadera} cm</Text>
                  )}
                  {profile.muslo && (
                    <Text style={styles.measurementText}>Muslo: {profile.muslo} cm</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#FFF',
    justifyContent: 'space-between',
  },
  metricButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 4,
  },
  metricButtonActive: {
    backgroundColor: '#007AFF',
  },
  metricButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '600',
  },
  metricButtonTextActive: {
    color: '#FFF',
  },
  differenceCard: {
    backgroundColor: '#FFF',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  differenceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  differenceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  differenceText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  chartContainer: {
    backgroundColor: '#FFF',
    margin: 15,
    padding: 15,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataCard: {
    backgroundColor: '#FFF',
    margin: 15,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  historySection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  latestBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  latestBadgeText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '600',
  },
  historyData: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  historyDataItem: {
    width: '48%',
    marginBottom: 10,
  },
  historyDataLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  historyDataValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  measurementsContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  measurementsTitle: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 8,
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  measurementText: {
    fontSize: 12,
    color: '#666',
    marginRight: 15,
    marginBottom: 5,
  },
});