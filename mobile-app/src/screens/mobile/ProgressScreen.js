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
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function ProgressScreen({ navigation }) {
  const { theme } = useTheme();
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
      <SafeAreaView style={[{ flex: 1, backgroundColor: theme.bg }, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (profiles.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={64} color={theme.textMuted} />
          <Text style={[styles.emptyText, { color: theme.text }]}>No hay progreso registrado</Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Registra tu perfil físico para comenzar</Text>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.primary }]}
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

  // Capturar colores del tema para usar en las funciones del chartConfig
  const chartPrimary = theme.primary;
  const chartCard = theme.card;
  const chartTextSecondary = theme.textSecondary;

  // Mostrar solo las últimas 3 mediciones o todas
  const displayedProfiles = showAllHistory ? profiles : profiles.slice(0, 3);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Mi Progreso</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
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
                { backgroundColor: theme.card, borderColor: theme.card },
                selectedMetric === metric.key && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
              onPress={() => setSelectedMetric(metric.key)}
            >
              <Ionicons
                name={metric.icon}
                size={20}
                color={selectedMetric === metric.key ? '#fff' : theme.primary}
              />
              <Text style={[
                styles.metricButtonText,
                { color: theme.primary },
                selectedMetric === metric.key && { color: '#fff' }
              ]}>
                {metric.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Diferencia */}
        {difference && (
          <View style={[styles.differenceCard, { backgroundColor: theme.card }]}>
            <Ionicons
              name={difference.isPositive ? 'trending-up' : 'trending-down'}
              size={24}
              color={difference.isPositive ? theme.red : theme.primary}
            />
            <Text style={[
              styles.differenceValue,
              { color: difference.isPositive ? theme.red : theme.primary }
            ]}>
              {difference.isPositive ? '+' : '-'}{difference.value} {difference.unit}
            </Text>
            <Text style={[styles.differenceText, { color: theme.textSecondary }]}>vs. anterior</Text>
          </View>
        )}

        {/* Gráfica */}
        {chartData && chartData.datasets[0].data.some(d => d > 0) ? (
          <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>
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
                  backgroundColor: chartCard,
                  backgroundGradientFrom: chartCard,
                  backgroundGradientTo: chartCard,
                  decimalPlaces: 1,
                  color: (opacity = 1) => {
                    const hex = chartPrimary.replace('#', '');
                    const r = parseInt(hex.substring(0, 2), 16);
                    const g = parseInt(hex.substring(2, 4), 16);
                    const b = parseInt(hex.substring(4, 6), 16);
                    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                  },
                  labelColor: (opacity = 1) => {
                    return `rgba(148, 163, 184, ${opacity})`;
                  },
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: chartPrimary,
                  },
                }}
                bezier
                style={styles.chart}
              />
            </ScrollView>
            {profiles.length > 6 && (
              <Text style={[styles.chartNote, { color: theme.textMuted }]}>Mostrando últimos 6 registros</Text>
            )}
          </View>
        ) : (
          <View style={[styles.noDataCard, { backgroundColor: theme.card }]}>
            <Ionicons name="information-circle-outline" size={32} color={theme.orange} />
            <Text style={[styles.noDataText, { color: theme.textSecondary }]}>No hay datos para esta métrica</Text>
          </View>
        )}

        {/* Historial de Mediciones */}
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Historial de Mediciones</Text>

          {displayedProfiles.map((profile, index) => (
            <View key={profile.id} style={[styles.historyCard, { backgroundColor: theme.card }]}>
              <View style={styles.historyHeader}>
                <View style={styles.historyDate}>
                  <Ionicons name="calendar" size={16} color={theme.primary} />
                  <Text style={[styles.historyDateText, { color: theme.textSecondary }]}>
                    {new Date(profile.createdAt).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                {index === 0 && (
                  <View style={[styles.latestBadge, { backgroundColor: theme.primary + '25' }]}>
                    <Text style={[styles.latestBadgeText, { color: theme.primary }]}>Más reciente</Text>
                  </View>
                )}
              </View>

              <View style={styles.historyData}>
                <View style={styles.historyDataItem}>
                  <Text style={[styles.historyDataLabel, { color: theme.textSecondary }]}>Peso</Text>
                  <Text style={[styles.historyDataValue, { color: theme.text }]}>{profile.peso} kg</Text>
                </View>

                <View style={styles.historyDataItem}>
                  <Text style={[styles.historyDataLabel, { color: theme.textSecondary }]}>IMC</Text>
                  <Text style={[styles.historyDataValue, { color: theme.text }]}>
                    {profile.imc ? profile.imc.toFixed(1) : '--'}
                  </Text>
                </View>

                {profile.porcentajeGrasa && (
                  <View style={styles.historyDataItem}>
                    <Text style={[styles.historyDataLabel, { color: theme.textSecondary }]}>% Grasa</Text>
                    <Text style={[styles.historyDataValue, { color: theme.text }]}>{profile.porcentajeGrasa}%</Text>
                  </View>
                )}

                {profile.masaMuscular && (
                  <View style={styles.historyDataItem}>
                    <Text style={[styles.historyDataLabel, { color: theme.textSecondary }]}>Músculo</Text>
                    <Text style={[styles.historyDataValue, { color: theme.text }]}>{profile.masaMuscular} kg</Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {/* Botón Ver más/menos */}
          {profiles.length > 3 && (
            <TouchableOpacity
              style={[styles.showMoreButton, { backgroundColor: theme.card }]}
              onPress={() => setShowAllHistory(!showAllHistory)}
            >
              <Text style={[styles.showMoreText, { color: theme.primary }]}>
                {showAllHistory ? 'Ver menos' : `Ver todas (${profiles.length})`}
              </Text>
              <Ionicons
                name={showAllHistory ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Sección de Fotos */}
        <View style={styles.photosSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Fotos de Progreso</Text>
          <View style={[styles.photosPlaceholder, { backgroundColor: theme.card }]}>
            <Ionicons name="images-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.photosPlaceholderText, { color: theme.text }]}>Próximamente</Text>
            <Text style={[styles.photosPlaceholderSubtext, { color: theme.textSecondary }]}>Podrás subir fotos desde la tablet del gimnasio</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: width * 0.06,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: width > 400 ? 28 : 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: width > 400 ? 16 : 14,
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
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  createButton: {
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
    borderWidth: 1,
  },
  metricButtonText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
  },
  differenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  chartContainer: {
    marginHorizontal: width * 0.06,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noDataCard: {
    marginHorizontal: width * 0.06,
    marginBottom: 20,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
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
    marginBottom: 16,
  },
  historyCard: {
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
    fontWeight: '500',
  },
  latestBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  latestBadgeText: {
    fontSize: 10,
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
    marginBottom: 4,
  },
  historyDataValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  photosSection: {
    paddingHorizontal: width * 0.06,
    marginBottom: 40,
  },
  photosPlaceholder: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  photosPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  photosPlaceholderSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
