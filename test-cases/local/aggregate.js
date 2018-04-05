import moment from 'moment'

import { durationAggregator } from '../../../lib/handler/stats/aggregate'

const second = 1000
const minute = 60 * second

const aggregateDurations = durationAggregator(1000)

export const testAggregate = async (t, testConfig) => {
  const startTime = moment().startOf('year')
  const endTime = startTime.clone().add(5, 'minutes')

  {
    const buckets = aggregateDurations(startTime, endTime, minute, [])

    t.deepEquals(buckets, [0, 0, 0, 0, 0])
  }

  t.comment('aggregate with too many buckets should throw error')

  t.throws(() => aggregateDurations(
    startTime,
    startTime.clone().add(1, 'year'),
    minute, []))

  {
    const entries = [
      {
        start_time: startTime.clone().add(1, 'minutes'),
        end_time: startTime.clone().add(2, 'minutes')
      }
    ]

    const buckets = aggregateDurations(startTime, endTime, minute, entries)
    t.deepEquals(buckets, [0, minute, 0, 0, 0])
  }
  {
    const entries = [
      {
        start_time: startTime.clone().add(10, 'seconds'),
        end_time: startTime.clone().add(20, 'seconds')
      }
    ]

    const buckets = aggregateDurations(startTime, endTime, minute, entries)
    t.deepEquals(buckets, [10 * second, 0, 0, 0, 0])
  }
  {
    const entries = [
      {
        start_time: endTime.clone().subtract(20, 'seconds'),
        end_time: endTime.clone().subtract(10, 'seconds')
      }
    ]

    const buckets = aggregateDurations(startTime, endTime, minute, entries)
    t.deepEquals(buckets, [0, 0, 0, 0, 10 * second])
  }
  {
    const entries = [
      {
        start_time: startTime.clone().add(30, 'seconds'),
        end_time: startTime.clone().add(90, 'seconds')
      }
    ]

    t.deepEquals(
      aggregateDurations(startTime, endTime, minute, entries),
      [30 * second, 30 * second, 0, 0, 0])

    t.deepEquals(
      aggregateDurations(startTime, endTime, 2 * minute, entries),
      [minute, 0, 0])
  }
  {
    const entries = [
      {
        start_time: startTime.clone().subtract(10, 'seconds'),
        end_time: startTime.clone().add(90, 'seconds')
      }
    ]

    t.deepEquals(
      aggregateDurations(startTime, endTime, minute, entries),
      [minute, 30 * second, 0, 0, 0])

    t.deepEquals(
      aggregateDurations(startTime, endTime, 2 * minute, entries),
      [90 * second, 0, 0])
  }
  {
    const entries = [
      {
        start_time: endTime.clone().subtract(20, 'seconds'),
        end_time: endTime.clone().add(10, 'seconds')
      }
    ]

    t.deepEquals(
      aggregateDurations(startTime, endTime, minute, entries),
      [0, 0, 0, 0, 20 * second])

    t.deepEquals(
      aggregateDurations(startTime, endTime, 2 * minute, entries),
      [0, 0, 20 * second])
  }
  {
    const entries = [
      {
        start_time: startTime.clone().subtract(20, 'seconds'),
        end_time: endTime.clone().add(20, 'seconds')
      }
    ]

    t.deepEquals(
      aggregateDurations(startTime, endTime, minute, entries),
      [minute, minute, minute, minute, minute])
  }
  {
    const entries = [
      {
        start_time: startTime.clone().add(30, 'seconds'),
        end_time: startTime.clone().add(90, 'seconds')
      },
      {
        start_time: startTime.clone().subtract(10, 'seconds'),
        end_time: startTime.clone().add(90, 'seconds')
      },
      {
        start_time: endTime.clone().subtract(20, 'seconds'),
        end_time: endTime.clone().add(10, 'seconds')
      },
      {
        start_time:
          startTime.clone().add(2, 'minutes').add(15, 'seconds'),
        end_time: startTime.clone().add(3, 'minutes').add(5, 'seconds')
      }
    ]

    t.deepEquals(
      aggregateDurations(startTime, endTime, minute, entries), [
        90 * second,
        minute,
        45 * second,
        5 * second,
        20 * second
      ])

    t.deepEquals(
      aggregateDurations(startTime, endTime, 2 * minute, entries), [
        2 * minute + 30 * second,
        50 * second,
        20 * second
      ])

    t.deepEquals(
      aggregateDurations(startTime, endTime, 30 * minute, entries),
      [ 220 * second ])
  }
}
