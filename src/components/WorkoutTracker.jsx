import React, { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

const WorkoutTracker = ({ user, selectedDate, onDateChange, onSuccess, onError }) => {
  const [selectedMuscles, setSelectedMuscles] = useState([])
  const [workouts, setWorkouts] = useState({})
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [exerciseName, setExerciseName] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [exercises, setExercises] = useState([])
  const [notes, setNotes] = useState('')
  const [editingExercise, setEditingExercise] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const muscleGroups = ['Chest', 'Shoulders', 'Triceps', 'Biceps', 'Back', 'Legs', 'Abs', 'Cardio']

  useEffect(() => {
    if (user) {
      loadWorkouts(user.id)
      loadExercises(user.id)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadExercises(user.id)
    }
  }, [selectedDate])

  // Load Workouts
  const loadWorkouts = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
      
      if (error) {
        console.error('Error loading workouts:', error)
        if (onError) onError('Error loading workouts')
        return
      }
      
      if (data) {
        const workoutMap = {}
        data.forEach(workout => {
          workoutMap[workout.workout_date] = workout.muscle_groups
        })
        setWorkouts(workoutMap)
        // Set selected muscles for current date
        if (workoutMap[selectedDate]) {
          setSelectedMuscles(workoutMap[selectedDate])
        } else {
          setSelectedMuscles([])
        }
      }
    } catch (err) {
      console.error('Unexpected error loading workouts:', err)
      if (onError) onError('Error loading workouts')
    }
  }

  // Load Exercises
  const loadExercises = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', userId)
        .eq('workout_date', selectedDate)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error loading exercises:', error)
        return
      }
      
      if (data) {
        setExercises(data)
      }
    } catch (err) {
      console.error('Unexpected error loading exercises:', err)
    }
  }

  // Save Workout
  const saveWorkout = async () => {
    if (!user || selectedMuscles.length === 0) {
      if (onError) onError('Please select at least one muscle group')
      return
    }

    setSaving(true)
    try {
      // Check if workout exists for this date
      const { data: existingWorkout, error: checkError } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', user.id)
        .eq('workout_date', selectedDate)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking existing workout:', checkError)
        if (onError) onError('Error checking existing workout')
        return
      }

      let error
      if (existingWorkout) {
        // Update existing workout
        const { error: updateError } = await supabase
          .from('workouts')
          .update({
            muscle_groups: selectedMuscles
          })
          .eq('id', existingWorkout.id)
        error = updateError
      } else {
        // Insert new workout
        const { error: insertError } = await supabase
          .from('workouts')
          .insert({
            user_id: user.id,
            workout_date: selectedDate,
            muscle_groups: selectedMuscles
          })
        error = insertError
      }

      if (error) {
        console.error('Error saving workout:', error)
        if (onError) onError('Error saving workout: ' + error.message)
        return
      }

      // Update local state
      await loadWorkouts(user.id)
      if (onSuccess) onSuccess('✅ Workout saved successfully!')
    } catch (err) {
      console.error('Unexpected error saving workout:', err)
      if (onError) onError('Error saving workout')
    } finally {
      setSaving(false)
    }
  }

  // Add Exercise
  const addExercise = async () => {
    if (!user || !exerciseName) {
      if (onError) onError('Please enter an exercise name')
      return
    }

    setLoading(true)
    try {
      const exerciseData = {
        user_id: user.id,
        workout_date: selectedDate,
        exercise_name: exerciseName,
        sets: parseInt(sets) || 0,
        reps: parseInt(reps) || 0,
        weight: parseFloat(weight) || 0,
        notes: notes || ''
      }

      let error
      if (editingExercise) {
        const { error: updateError } = await supabase
          .from('exercises')
          .update(exerciseData)
          .eq('id', editingExercise.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('exercises')
          .insert(exerciseData)
        error = insertError
      }

      if (error) {
        console.error('Error saving exercise:', error)
        if (onError) onError('Error saving exercise: ' + error.message)
        return
      }

      await loadExercises(user.id)
      setExerciseName('')
      setSets('')
      setReps('')
      setWeight('')
      setNotes('')
      setEditingExercise(null)
      if (onSuccess) onSuccess(editingExercise ? '✅ Exercise updated!' : '✅ Exercise added!')
      setShowWorkoutModal(false)
    } catch (err) {
      console.error('Unexpected error saving exercise:', err)
      if (onError) onError('Error saving exercise')
    } finally {
      setLoading(false)
    }
  }

  // Delete Exercise
  const deleteExercise = async (id) => {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting exercise:', error)
        if (onError) onError('Error deleting exercise')
        return
      }
      
      await loadExercises(user.id)
      if (onSuccess) onSuccess('🗑️ Exercise deleted')
    } catch (err) {
      console.error('Unexpected error deleting exercise:', err)
      if (onError) onError('Error deleting exercise')
    }
  }

  // Edit Exercise
  const editExercise = (exercise) => {
    setEditingExercise(exercise)
    setExerciseName(exercise.exercise_name)
    setSets(exercise.sets.toString())
    setReps(exercise.reps.toString())
    setWeight(exercise.weight.toString())
    setNotes(exercise.notes || '')
    setShowWorkoutModal(true)
  }

  // Get workout stats
  const getWorkoutStats = () => {
    const today = selectedDate
    const todayExercises = exercises.filter(e => e.workout_date === today)
    const totalSets = todayExercises.reduce((sum, e) => sum + e.sets, 0)
    const totalReps = todayExercises.reduce((sum, e) => sum + e.reps, 0)
    return { totalSets, totalReps, totalExercises: todayExercises.length }
  }

  const stats = getWorkoutStats()

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = e.target.value
    if (onDateChange) {
      onDateChange(newDate)
    }
  }

  return (
    <div style={styles.workoutSection}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Workout Tracker</h2>
        <button 
          onClick={() => {
            setEditingExercise(null)
            setExerciseName('')
            setSets('')
            setReps('')
            setWeight('')
            setNotes('')
            setShowWorkoutModal(true)
          }} 
          style={styles.addButton}
        >
          + Add Exercise
        </button>
      </div>

      {/* Date Selector */}
      <div style={styles.dateSelectorContainer}>
        <label style={styles.label}>Select Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          style={styles.dateInput}
        />
        <span style={styles.dateDisplay}>{formatDate(selectedDate)}</span>
      </div>

      {/* Stats Summary */}
      <div style={styles.statsRow}>
        <div style={styles.statBox}>
          <span style={styles.statNumber}>{stats.totalExercises}</span>
          <span style={styles.statLabel}>Exercises</span>
        </div>
        <div style={styles.statBox}>
          <span style={styles.statNumber}>{stats.totalSets}</span>
          <span style={styles.statLabel}>Sets</span>
        </div>
        <div style={styles.statBox}>
          <span style={styles.statNumber}>{stats.totalReps}</span>
          <span style={styles.statLabel}>Reps</span>
        </div>
      </div>

      <div style={styles.workoutControls}>
        <div style={styles.muscleSelector}>
          <label style={styles.label}>Muscle Groups</label>
          <div style={styles.muscleButtons}>
            {muscleGroups.map(muscle => (
              <button
                key={muscle}
                onClick={() => {
                  if (selectedMuscles.includes(muscle)) {
                    setSelectedMuscles(selectedMuscles.filter(m => m !== muscle))
                  } else {
                    setSelectedMuscles([...selectedMuscles, muscle])
                  }
                }}
                style={{
                  ...styles.muscleButton,
                  backgroundColor: selectedMuscles.includes(muscle) ? '#667eea' : '#e5e7eb',
                  color: selectedMuscles.includes(muscle) ? 'white' : '#374151',
                }}
              >
                {muscle}
              </button>
            ))}
          </div>
          <button
            onClick={saveWorkout}
            disabled={selectedMuscles.length === 0 || saving}
            style={{
              ...styles.saveWorkoutButton,
              opacity: selectedMuscles.length === 0 || saving ? 0.5 : 1,
              cursor: selectedMuscles.length === 0 || saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save Workout'}
          </button>
        </div>
      </div>

      {/* Exercises List */}
      <div style={styles.exercisesList}>
        <h3 style={styles.exercisesTitle}>Today's Exercises</h3>
        {exercises.length === 0 ? (
          <p style={styles.emptyState}>No exercises logged for today. Click "Add Exercise" to get started!</p>
        ) : (
          exercises.map(exercise => (
            <div key={exercise.id} style={styles.exerciseItem}>
              <div style={styles.exerciseInfo}>
                <span style={styles.exerciseName}>{exercise.exercise_name}</span>
                <span style={styles.exerciseDetails}>
                  {exercise.sets} sets × {exercise.reps} reps
                  {exercise.weight > 0 && ` @ ${exercise.weight}kg`}
                </span>
                {exercise.notes && (
                  <span style={styles.exerciseNotes}>{exercise.notes}</span>
                )}
              </div>
              <div style={styles.exerciseActions}>
                <button 
                  onClick={() => editExercise(exercise)}
                  style={styles.editButton}
                  title="Edit"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => deleteExercise(exercise.id)}
                  style={styles.deleteButton}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Workout Modal */}
      {showWorkoutModal && (
        <div style={styles.modalOverlay} onClick={() => setShowWorkoutModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {editingExercise ? 'Edit Exercise' : 'Add Exercise'}
            </h2>
            <div style={styles.modalForm}>
              <input
                type="text"
                placeholder="Exercise name"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                style={styles.modalInput}
              />
              <div style={styles.modalRow}>
                <input
                  type="number"
                  placeholder="Sets"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  style={styles.modalInputSmall}
                />
                <input
                  type="number"
                  placeholder="Reps"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  style={styles.modalInputSmall}
                />
                <input
                  type="number"
                  placeholder="Weight (kg)"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  style={styles.modalInputSmall}
                />
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={styles.modalTextarea}
              />
              <div style={styles.modalActions}>
                <button 
                  onClick={() => {
                    setShowWorkoutModal(false)
                    setEditingExercise(null)
                    setExerciseName('')
                    setSets('')
                    setReps('')
                    setWeight('')
                    setNotes('')
                  }}
                  style={styles.modalCancel}
                >
                  Cancel
                </button>
                <button 
                  onClick={addExercise}
                  disabled={!exerciseName || loading}
                  style={{
                    ...styles.modalSave,
                    opacity: !exerciseName || loading ? 0.5 : 1,
                    cursor: !exerciseName || loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Saving...' : (editingExercise ? 'Update' : 'Add')} Exercise
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  workoutSection: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  addButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  dateSelectorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.5rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  dateDisplay: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#667eea',
    marginLeft: 'auto',
  },
  dateInput: {
    padding: '0.4rem 0.75rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    flex: 1,
    minWidth: '150px',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: '0.5rem',
    padding: '0.75rem',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
    display: 'block',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  workoutControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  muscleSelector: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  muscleButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  muscleButton: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
  saveWorkoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '0.5rem',
  },
  exercisesList: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '1rem',
  },
  exercisesTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.75rem',
  },
  emptyState: {
    color: '#9ca3af',
    fontSize: '0.875rem',
    textAlign: 'center',
    padding: '1rem',
  },
  exerciseItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    marginBottom: '0.5rem',
    backgroundColor: '#f9fafb',
    transition: 'all 0.3s ease',
  },
  exerciseInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
  },
  exerciseName: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: '0.875rem',
  },
  exerciseDetails: {
    color: '#6b7280',
    fontSize: '0.75rem',
  },
  exerciseNotes: {
    color: '#9ca3af',
    fontSize: '0.7rem',
    fontStyle: 'italic',
  },
  exerciseActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  editButton: {
    padding: '0.25rem 0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    borderRadius: '0.25rem',
    transition: 'all 0.3s ease',
  },
  deleteButton: {
    padding: '0.25rem 0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    borderRadius: '0.25rem',
    transition: 'all 0.3s ease',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '30px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '1.5rem',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  modalInput: {
    padding: '0.75rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
  },
  modalRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '0.5rem',
  },
  modalInputSmall: {
    padding: '0.75rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
  },
  modalTextarea: {
    padding: '0.75rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    marginTop: '0.5rem',
  },
  modalCancel: {
    padding: '0.5rem 1.5rem',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  modalSave: {
    padding: '0.5rem 1.5rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
}

export default WorkoutTracker
