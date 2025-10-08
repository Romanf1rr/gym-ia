import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api/api.service';

const { width, height } = Dimensions.get('window');

export default function ProgressScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('peso');
  const [showAllHistory, setShowAllHistory] = useState(false);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/physical-profiles');
      
      if (response.data && response.data.length > 0) {
        const sortedProfiles = response.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setProfiles(sortedProfiles);
      } else {
        setProfiles([]);
      }
    } catch (error) {
      console.error('Error cargando progreso:', error);
      Alert.alert('Error', 'No se pudo cargar el progreso');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProfiles();
    }, [])
  );

  const getChartData = () => {
    if (profiles.length === 0) return null;

    // Limitar a 6 registros más recientes para la gráfica
    const recentProfiles = profiles.slice(0, 6).reverse();

    const labels = recentProfiles.map(p => {
      const date = new Date(p.createdAt);
      return date.toLocaleDateString('es-MX', { 
        day: 'numeric', 
        month: 'short' 
      });
    });

    let data = [];

    switch (selectedMetric) {
      case 'peso':
        data = recentProfiles.map(p => p.peso || 0);
        break;
      case 'imc':
        data = recentProfiles.map(p => p.imc || 0);
        break;
      case 'grasa':
        data = recentProfiles.map(p => p.porcentajeGrasa || 0);
        break;
      case 'musculo':
        data = recentProfiles.map(p => p.masaMuscular || 0);
        break;
      default:
        data = recentProfiles.map(p => p.peso || 0);
    }

    const validData = data.filter(d => d > 0);
    if (validData.length === 0) return null;

    return {
      labels,
      datasets: [{ data }],
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
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </SafeAreaView>
    );
  }

  if (profiles.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={64} color="#64748b" />
          <Text style={styles.emptyText}>No hay progreso registrado</Text>
          <Text style={styles.emptySubtext}>Registra tu perfil físico para comenzar</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => navigation.navigate('Perfil', { screen: 'PhysicalProfile' })}
          >
            <Text style={styles.createButtonText}>Crear Perfil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const chartData = getChartData();
  const difference = getDifference();

  // Mostrar solo las últimas 3 mediciones o todas
  const displayedProfiles = showAllHistory ? profiles : profiles.slice(0, 3);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mi Progreso</Text>
          <Text style={styles.subtitle}>
            {profiles.length} {profiles.length === 1 ? 'registro' : 'registros'}
          </Text>
        </View>

        {/* Selector de Métricas */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.metricsContainer}
          contentContainerStyle={styles.metricsContent}
        >
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
                color={selectedMetric === metric.key ? '#fff' : '#8b5cf6'} 
              />
              <Text style={[
                styles.metricButtonText,
                selectedMetric === metric.key && styles.metricButtonTextActive
              ]}>
                {metric.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Diferencia */}
        {difference && (
          <View style={styles.differenceCard}>
            <Ionicons 
              name={difference.isPositive ? 'trending-up' : 'trending-down'} 
              size={24} 
              color={difference.isPositive ? '#ef4444' : '#10b981'} 
            />
            <Text style={[
              styles.differenceValue,
              { color: difference.isPositive ? '#ef4444' : '#10b981' }
            ]}>
              {difference.isPositive ? '+' : '-'}{difference.value} {difference.unit}
            </Text>
            <Text style={styles.differenceText}>vs. anterior</Text>
          </View>
        )}

        {/* Gráfica */}
        {chartData && chartData.datasets[0].data.some(d => d > 0) ? (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>
              Evolución de {metrics.find(m => m.key === selectedMetric)?.label}
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chartScrollContent}
            >
              <LineChart
                data={chartData}
                width={Math.max(width - 60, chartData.labels.length * 80)}
                height={220}
                chartConfig={{
                  backgroundColor: '#1e293b',
                  backgroundGradientFrom: '#1e293b',
                  backgroundGradientTo: '#1e293b',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#8b5cf6',
                  },
                }}
                bezier
                style={styles.chart}
              />
            </ScrollView>
            {profiles.length > 6 && (
              <Text style={styles.chartNote}>Mostrando últimos 6 registros</Text>
            )}
          </View>
        ) : (
          <View style={styles.noDataCard}>
            <Ionicons name="information-circle-outline" size={32} color="#f97316" />
            <Text style={styles.noDataText}>No hay datos para esta métrica</Text>
          </View>
        )}

        {/* Historial de Mediciones */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historial de Mediciones</Text>
          
          {displayedProfiles.map((profile, index) => (
            <View key={profile.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.historyDate}>
                  <Ionicons name="calendar" size={16} color="#8b5cf6" />
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
            </View>
          ))}

          {/* Botón Ver más/menos */}
          {profiles.length > 3 && (
            <TouchableOpacity 
              style={styles.showMoreButton}
              onPress={() => setShowAllHistory(!showAllHistory)}
            >
              <Text style={styles.showMoreText}>
                {showAllHistory ? 'Ver menos' : `Ver todas (${profiles.length})`}
              </Text>
              <Ionicons 
                name={showAllHistory ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#8b5cf6" 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Sección de Fotos */}
        <View style={styles.photosSection}>
          <Text style={styles.sectionTitle}>Fotos de Progreso</Text>
          <View style={styles.photosPlaceholder}>
            <Ionicons name="images-outline" size={48} color="#64748b" />
            <Text style={styles.photosPlaceholderText}>Próximamente</Text>
            <Text style={styles.photosPlaceholderSubtext}>Podrás subir fotos desde la tablet del gimnasio</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: width * 0.06,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: width > 400 ? 28 : 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: width > 400 ? 16 : 14,
    color: '#94a3b8',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: height * 0.2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 10,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  metricsContainer: {
    marginBottom: 20,
  },
  metricsContent: {
    paddingHorizontal: width * 0.06,
    gap: 10,
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  metricButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  metricButtonText: {
    fontSize: 14,
    color: '#8b5cf6',
    marginLeft: 8,
    fontWeight: '600',
  },
  metricButtonTextActive: {
    color: '#fff',
  },
  differenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: width * 0.06,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  differenceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  differenceText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  chartContainer: {
    backgroundColor: '#1e293b',
    marginHorizontal: width * 0.06,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  chartScrollContent: {
    paddingRight: 20,
  },
  chart: {
    borderRadius: 16,
  },
  chartNote: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noDataCard: {
    backgroundColor: '#1e293b',
    marginHorizontal: width * 0.06,
    marginBottom: 20,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 10,
    textAlign: 'center',
  },
  historySection: {
    paddingHorizontal: width * 0.06,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  historyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDateText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  latestBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  latestBadgeText: {
    fontSize: 10,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  historyData: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  historyDataItem: {
    width: '45%',
  },
  historyDataLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  historyDataValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  showMoreText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  photosSection: {
    paddingHorizontal: width * 0.06,
    marginBottom: 40,
  },
  photosPlaceholder: {
    backgroundColor: '#1e293b',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  photosPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  photosPlaceholderSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
});