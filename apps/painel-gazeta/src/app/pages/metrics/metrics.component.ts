import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { SkeletonModule } from 'primeng/skeleton';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { MetricsService } from './metrics.service';
import { DateRange, Granularity, KpiMetric, LogEvent, TopNewsItem } from './models';
import { forkJoin } from 'rxjs';
import type { ChartData, ChartOptions } from 'chart.js';


@Component({
  selector: 'app-metrics',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    DatePickerModule,
    SelectModule,
    ButtonModule,
    TableModule,
    TimelineModule,
    SkeletonModule,
    ChartModule,
    TooltipModule,
  ],
  templateUrl: './metrics.component.html',
  styleUrl: './metrics.component.scss',
})
export class MetricsComponent implements OnInit {
  loading = false;
  lastUpdate: Date | null = null;

  period: Date[] = [];
  granularityOptions = [
    { label: 'Diário', value: 'day' as Granularity },
    { label: 'Horário', value: 'hour' as Granularity },
  ];
  selectedGranularity: Granularity = 'day';

  kpis: KpiMetric[] = [];
  accessData: ChartData | undefined;
  accessOptions: ChartOptions | undefined;
  pagesData: ChartData | undefined;
  pagesOptions: ChartOptions | undefined;
  topNews: TopNewsItem[] = [];
  logs: LogEvent[] = [];

  private metrics = inject(MetricsService);

  ngOnInit(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    this.period = [start, end];
    this.selectedGranularity = 'day';
    this.setupChartOptions();
    this.applyFilters();
  }

  applyFilters(): void {
    if (!this.period || this.period.length < 2) {
      return;
    }
    const range: DateRange = { start: this.normalizeDate(this.period[0]), end: this.normalizeDate(this.period[1], true) };
    const gran = this.selectedGranularity;
    this.loading = true;

    forkJoin({
      kpis: this.metrics.getKpis(range),
      access: this.metrics.getAccessSeries(range, gran),
      pages: this.metrics.getPagesSeries(range, gran),
      top: this.metrics.getTopNews(range),
      logs: this.metrics.getLogs(range),
    }).subscribe(({ kpis, access, pages, top, logs }) => {
      this.kpis = kpis;
      this.accessData = access;
      this.pagesData = pages;
      this.topNews = top;
      this.logs = logs;
      this.loading = false;
      this.lastUpdate = new Date();
    });
  }

  private setupChartOptions(): void {
    this.accessOptions = this.baseChartOptions();
    this.pagesOptions = this.baseChartOptions();
  }

  private baseChartOptions(): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: { enabled: true },
      },
      scales: {
        x: { ticks: { color: '#6b7280' }, grid: { display: false } },
        y: { ticks: { color: '#6b7280' }, grid: { color: '#e5e7eb' } },
      },
    };
  }

  private normalizeDate(d: Date, endOfDay = false): Date {
    const copy = new Date(d);
    if (endOfDay) {
      copy.setHours(23, 59, 59, 999);
    } else {
      copy.setHours(0, 0, 0, 0);
    }
    return copy;
  }

  /**
   * Retorna o ícone correspondente ao KPI
   */
  getKpiIcon(index: number): string {
    const icons = ['pi-users', 'pi-file', 'pi-eye', 'pi-clock'];
    return icons[index] || 'pi-info-circle';
  }

  /**
   * Retorna o tooltip explicativo para cada KPI
   */
  getKpiTooltip(index: number): string {
    const tooltips = [
      'Número total de acessos ao site no período selecionado',
      'Quantidade de páginas visualizadas por todos os visitantes',
      'Número de visitantes únicos que acessaram o site',
      'Tempo médio que os visitantes permanecem no site (em minutos)',
    ];
    return tooltips[index] || '';
  }

  /**
   * Retorna o ícone Material Icons correspondente ao KPI
   */
  getKpiMaterialIcon(index: number): string {
    const icons = ['people', 'description', 'visibility', 'schedule'];
    return icons[index] || 'info';
  }
}

