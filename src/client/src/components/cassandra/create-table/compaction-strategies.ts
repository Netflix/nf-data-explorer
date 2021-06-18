import i18n from '@/i18n';
import {
  faChartBar,
  faClock,
  faSortAmountUp,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

export interface ICompactionStrategyOption {
  id: string;
  label: string;
  type: string;
  value: any;
  multiValue?: any[];
}

export interface ICompactionStrategy {
  name: string;
  value: string;
  icon: IconDefinition;
  pros: string[];
  cons: string[];
  options: ICompactionStrategyOption[];
  versionRegex?: RegExp;
}

export function getCompactionStrategies(): ICompactionStrategy[] {
  return [
    {
      name: 'SizeTiered',
      value: 'SizeTieredCompactionStrategy',
      icon: faChartBar,
      pros: i18n.t(
        'cassandra.strategies.compaction.sizeTieredCompactionStrategy.pros',
      ) as any,
      cons: i18n.t(
        'cassandra.strategies.compaction.sizeTieredCompactionStrategy.cons',
      ) as any,
      options: [
        {
          label: 'Min Threshold (MB)',
          id: 'minThreshold',
          type: 'number',
          value: 4,
        },
        {
          label: 'Max Threshold (MB)',
          id: 'maxThreshold',
          type: 'number',
          value: 32,
        },
        {
          label: 'Min SSTable Size (MB)',
          id: 'minSSTableSize',
          type: 'number',
          value: 50,
        },
      ],
    },
    {
      name: 'Leveled',
      value: 'LeveledCompactionStrategy',
      icon: faSortAmountUp,
      pros: i18n.t(
        'cassandra.strategies.compaction.leveledCompactionStrategy.pros',
      ) as any,
      cons: i18n.t(
        'cassandra.strategies.compaction.leveledCompactionStrategy.cons',
      ) as any,
      options: [
        {
          label: 'SS Table Size (MB)',
          id: 'ssTableSizeInMB',
          type: 'number',
          value: 512,
        },
      ],
    },
    {
      name: 'TimeWindow',
      value: 'TimeWindowCompactionStrategy',
      icon: faClock,
      pros: i18n.t(
        'cassandra.strategies.compaction.timeWindowCompactionStrategy.pros',
      ) as any,
      cons: i18n.t(
        'cassandra.strategies.compaction.timeWindowCompactionStrategy.cons',
      ) as any,
      options: [
        {
          label: 'Bucket Size',
          id: 'compactionWindowUnit',
          type: 'string',
          value: 'DAYS',
          multiValue: ['MINUTES', 'HOURS', 'DAYS'],
        },
        {
          label: 'Units per Bucket',
          id: 'compactionWindowSize',
          type: 'number',
          value: null,
        },
      ],
      versionRegex: /^3\./,
    },
  ];
}
